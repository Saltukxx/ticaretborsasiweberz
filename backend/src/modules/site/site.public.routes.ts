import type { FastifyInstance } from "fastify";
import { getClientIp } from "../../lib/clientIp.js";
import rateLimit from "@fastify/rate-limit";
import {
  contactFormBodySchema,
  legalSlugParamsSchema,
  newsletterSubscribeBodySchema,
  newsletterUnsubscribeBodySchema,
} from "./site.schema.js";
import {
  createContactSubmission,
  getLegalPagePublic,
  getSiteContactPublic,
  subscribeNewsletter,
  unsubscribeNewsletter,
} from "./site.service.js";
import { verifyNewsletterUnsubscribeToken } from "../../lib/newsletterToken.js";

export async function publicSitePlugin(fastify: FastifyInstance) {
  fastify.get("/site/contact", async (_req, reply) => {
    const data = await getSiteContactPublic(fastify.db);
    return reply.send({ data });
  });

  fastify.get("/legal/:slug", async (req, reply) => {
    const params = legalSlugParamsSchema.safeParse(req.params);
    if (!params.success) {
      return reply.status(400).send({
        error: { code: "VALIDATION_ERROR", message: "Geçersiz sayfa." },
      });
    }
    const result = await getLegalPagePublic(fastify.db, params.data.slug);
    if (!result.ok) {
      const status = result.code === "NOT_PUBLISHED" ? 404 : 404;
      return reply.status(status).send({
        error: { code: "NOT_FOUND", message: "Sayfa bulunamadı." },
      });
    }
    return reply.send({ data: result.row });
  });

  await fastify.register(
    async (scope) => {
      await scope.register(rateLimit, {
        max: 5,
        timeWindow: 15 * 60 * 1000,
        keyGenerator: (req) => getClientIp(req),
      });

      scope.post("/contact", async (req, reply) => {
        const parsed = contactFormBodySchema.safeParse(req.body);
        if (!parsed.success) {
          return reply.status(400).send({
            error: {
              code: "VALIDATION_ERROR",
              details: parsed.error.flatten().fieldErrors,
            },
          });
        }
        const row = await createContactSubmission(fastify.db, {
          ...parsed.data,
          ipAddress: getClientIp(req),
          userAgent:
            typeof req.headers["user-agent"] === "string"
              ? req.headers["user-agent"]
              : undefined,
        });
        return reply.status(201).send({ data: { id: row.id } });
      });
    },
    { prefix: "" },
  );

  await fastify.register(
    async (scope) => {
      await scope.register(rateLimit, {
        max: 3,
        timeWindow: 60 * 60 * 1000,
        keyGenerator: (req) => getClientIp(req),
      });

      scope.post("/newsletter/subscribe", async (req, reply) => {
        const parsed = newsletterSubscribeBodySchema.safeParse(req.body);
        if (!parsed.success) {
          return reply.status(400).send({
            error: {
              code: "VALIDATION_ERROR",
              details: parsed.error.flatten().fieldErrors,
            },
          });
        }
        const row = await subscribeNewsletter(fastify.db, {
          ...parsed.data,
          ipAddress: getClientIp(req),
        });
        return reply.status(201).send({ data: { id: row.id, email: row.email } });
      });

      scope.post("/newsletter/unsubscribe", async (req, reply) => {
        const parsed = newsletterUnsubscribeBodySchema.safeParse(req.body);
        if (!parsed.success) {
          return reply.status(400).send({
            error: {
              code: "VALIDATION_ERROR",
              details: parsed.error.flatten().fieldErrors,
            },
          });
        }
        const { email, token } = parsed.data;
        if (
          !verifyNewsletterUnsubscribeToken(fastify.config.jwtSecret, email, token)
        ) {
          return reply.status(403).send({
            error: {
              code: "INVALID_TOKEN",
              message: "Bağlantı geçersiz veya süresi dolmuş.",
            },
          });
        }
        // Abone olup olmadığını ifşa etmemek için her durumda başarı döner.
        await unsubscribeNewsletter(fastify.db, email);
        return reply.send({ data: { ok: true } });
      });
    },
    { prefix: "" },
  );
}
