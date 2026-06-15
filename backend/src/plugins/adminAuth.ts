import type {
  FastifyInstance,
  FastifyReply,
  FastifyRequest,
  preHandlerAsyncHookHandler,
} from "fastify";
import fp from "fastify-plugin";
import { eq } from "drizzle-orm";
import { admins } from "../db/schema/index.js";
import { verifyAccessToken } from "../modules/auth/auth.tokens.js";

const UNAUTHORIZED = {
  error: {
    code: "UNAUTHORIZED",
    message: "Yetkilendirme gerekli.",
  },
} as const;

const INVALID_TOKEN = {
  error: {
    code: "UNAUTHORIZED",
    message: "Geçersiz veya süresi dolmuş jeton.",
  },
} as const;

const FORBIDDEN = {
  error: {
    code: "FORBIDDEN",
    message: "Bu işlem yalnızca süper yönetici ile yapılabilir.",
  },
} as const;

const FORBIDDEN_RESOURCE = {
  error: {
    code: "FORBIDDEN",
    message: "Bu kaynak yalnız süper yönetici içindir.",
  },
} as const;

async function authenticateAdmin(
  req: FastifyRequest,
  reply: FastifyReply,
  app: FastifyInstance,
): Promise<boolean> {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) {
    void reply.status(401).send(UNAUTHORIZED);
    return false;
  }

  const token = auth.slice("Bearer ".length).trim();
  let payload;
  try {
    payload = verifyAccessToken(app.config, token);
  } catch {
    void reply.status(401).send(INVALID_TOKEN);
    return false;
  }

  const [row] = await app.db
    .select({ role: admins.role, isActive: admins.isActive })
    .from(admins)
    .where(eq(admins.id, payload.sub))
    .limit(1);

  if (!row || !row.isActive) {
    void reply.status(401).send(INVALID_TOKEN);
    return false;
  }

  req.adminAuth = {
    sub: payload.sub,
    role: row.role as "super_admin" | "editor",
    typ: "access",
  };
  return true;
}

async function requireAdminAuth(
  this: FastifyInstance,
  req: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  await authenticateAdmin(req, reply, this);
}

async function requireSuperAdmin(
  this: FastifyInstance,
  req: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const ok = await authenticateAdmin(req, reply, this);
  if (!ok || reply.sent) return;

  if (req.adminAuth?.role !== "super_admin") {
    void reply.status(403).send(FORBIDDEN_RESOURCE);
  }
}

/** Route-level guard for destructive super-admin-only endpoints. */
export async function assertSuperAdmin(
  req: FastifyRequest,
  reply: FastifyReply,
): Promise<boolean> {
  if (req.adminAuth?.role !== "super_admin") {
    void reply.status(403).send(FORBIDDEN);
    return false;
  }
  return true;
}

async function adminAuthPlugin(app: FastifyInstance) {
  app.decorate("requireAdminAuth", requireAdminAuth);
  app.decorate("requireSuperAdmin", requireSuperAdmin);
}

export default fp(adminAuthPlugin, {
  name: "admin-auth",
});

declare module "fastify" {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface FastifyInstance {
    requireAdminAuth: preHandlerAsyncHookHandler;
    requireSuperAdmin: preHandlerAsyncHookHandler;
  }
}
