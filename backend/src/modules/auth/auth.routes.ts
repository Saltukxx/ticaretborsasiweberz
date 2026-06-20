import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { getClientIp } from "../../lib/clientIp.js";
import rateLimit from "@fastify/rate-limit";
import { eq } from "drizzle-orm";
import { admins } from "../../db/schema/index.js";
import { verifyAccessToken } from "./auth.tokens.js";
import {
  changePassword,
  loginAdmin,
  revokeRefreshByRaw,
  rotateRefreshToken,
} from "./auth.service.js";
import {
  changePasswordBodySchema,
  loginBodySchema,
} from "./auth.schema.js";

function setRefreshCookie(
  reply: FastifyReply,
  app: FastifyInstance,
  token: string,
) {
  reply.setCookie(app.config.sessionCookieName, token, {
    path: "/api/v1/admin/auth",
    httpOnly: true,
    secure: app.config.cookieSecure,
    sameSite: "strict",
    maxAge: app.config.jwtRefreshTtl,
  });
}

function clearRefreshCookie(reply: FastifyReply, app: FastifyInstance) {
  reply.clearCookie(app.config.sessionCookieName, {
    path: "/api/v1/admin/auth",
    httpOnly: true,
    secure: app.config.cookieSecure,
    sameSite: "strict",
  });
}

export async function authRoutes(app: FastifyInstance) {
  await app.register(
    async (loginScope) => {
      await loginScope.register(rateLimit, {
        max: 10,
        timeWindow: 15 * 60 * 1000,
        keyGenerator: (req) => {
          const ip = getClientIp(req);
          const body = req.body as { email?: unknown } | undefined;
          const email =
            typeof body?.email === "string"
              ? body.email.trim().toLowerCase()
              : "";
          return email ? `${ip}:${email}` : ip;
        },
      });

      loginScope.post("/login", async (req, reply) => {
        const parsed = loginBodySchema.safeParse(req.body);
        if (!parsed.success) {
          return reply.status(400).send({
            error: {
              code: "VALIDATION_ERROR",
              message: "Geçersiz giriş verisi",
              details: parsed.error.flatten().fieldErrors,
            },
          });
        }

        const result = await loginAdmin(app.db, app.redis, app.config, {
          email: parsed.data.email,
          password: parsed.data.password,
          ip: getClientIp(req),
          userAgent: req.headers["user-agent"],
        });

        if (!result.ok) {
          if (result.reason === "locked") {
            return reply.status(429).send({
              error: {
                code: "TOO_MANY_ATTEMPTS",
                message:
                  "Çok fazla başarısız deneme. Lütfen daha sonra tekrar deneyin.",
              },
            });
          }
          return reply.status(401).send({
            error: {
              code: "INVALID_CREDENTIALS",
              message: "E-posta veya şifre hatalı.",
            },
          });
        }

        setRefreshCookie(reply, app, result.refreshRaw);
        return reply.send({
          data: {
            accessToken: result.accessToken,
            admin: result.admin,
          },
        });
      });
    },
  );

  app.post("/refresh", async (req, reply) => {
    const raw = req.cookies[app.config.sessionCookieName];

    if (!raw) {
      return reply.status(401).send({
        error: { code: "NO_REFRESH", message: "Oturum yenileme bilgisi yok." },
      });
    }

    const rotated = await rotateRefreshToken(app.db, app.config, {
      refreshRaw: raw,
      ip: getClientIp(req),
      userAgent: req.headers["user-agent"],
    });

    if (!rotated.ok) {
      clearRefreshCookie(reply, app);
      return reply.status(401).send({
        error: {
          code: "INVALID_REFRESH",
          message: "Oturum geçersiz veya süresi dolmuş.",
        },
      });
    }

    setRefreshCookie(reply, app, rotated.refreshRaw);
    return reply.send({
      data: { accessToken: rotated.accessToken },
    });
  });

  app.post("/logout", async (req, reply) => {
    const raw = req.cookies[app.config.sessionCookieName];
    if (raw) await revokeRefreshByRaw(app.db, raw);
    clearRefreshCookie(reply, app);
    return reply.status(204).send();
  });

  app.get("/me", async (req, reply) => {
    const admin = await requireBearerAdmin(req, reply, app);
    if (!admin) return;

    const [row] = await app.db
      .select({
        id: admins.id,
        email: admins.email,
        name: admins.name,
        role: admins.role,
        isActive: admins.isActive,
      })
      .from(admins)
      .where(eq(admins.id, admin.sub))
      .limit(1);

    if (!row || !row.isActive) {
      return reply.status(401).send({
        error: { code: "UNAUTHORIZED", message: "Oturum geçersiz." },
      });
    }

    return reply.send({
      data: {
        id: row.id,
        email: row.email,
        name: row.name,
        role: row.role,
      },
    });
  });

  app.patch("/me/password", async (req, reply) => {
    const admin = await requireBearerAdmin(req, reply, app);
    if (!admin) return;

    const parsed = changePasswordBodySchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: {
          code: "VALIDATION_ERROR",
          message: "Geçersiz veri",
          details: parsed.error.flatten().fieldErrors,
        },
      });
    }

    const outcome = await changePassword(
      app.db,
      admin.sub,
      parsed.data.currentPassword,
      parsed.data.newPassword,
    );

    if (outcome === "not_found") {
      return reply.status(404).send({
        error: { code: "NOT_FOUND", message: "Kullanıcı bulunamadı." },
      });
    }
    if (outcome === "wrong_password") {
      return reply.status(403).send({
        error: {
          code: "WRONG_PASSWORD",
          message: "Mevcut şifre doğrulanamadı.",
        },
      });
    }

    clearRefreshCookie(reply, app);
    return reply.send({ data: { ok: true } });
  });
}

async function requireBearerAdmin(
  req: FastifyRequest,
  reply: FastifyReply,
  app: FastifyInstance,
) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) {
    reply.status(401).send({
      error: { code: "UNAUTHORIZED", message: "Yetkilendirme gerekli." },
    });
    return null;
  }
  const token = auth.slice("Bearer ".length).trim();
  try {
    return verifyAccessToken(app.config, token);
  } catch {
    reply.status(401).send({
      error: {
        code: "UNAUTHORIZED",
        message: "Geçersiz veya süresi dolmuş jeton.",
      },
    });
    return null;
  }
}
