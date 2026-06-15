import type { FastifyInstance } from "fastify";
import {
  and,
  count,
  desc,
  eq,
  type SQL,
} from "drizzle-orm";
import { z } from "zod";
import { announcements } from "../../db/schema/index.js";
import { activeAnnouncementWhere } from "./announcements.filters.js";
import { isValidSlug } from "../../lib/slug.js";

const listQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

const slugParamSchema = z.object({
  slug: z
    .string()
    .min(1)
    .max(255)
    .refine((s) => isValidSlug(s), { message: "invalid_slug" }),
});

export async function publicAnnouncementsPlugin(fastify: FastifyInstance) {
  fastify.get("/announcements/ticker", async (_req, reply) => {
    const now = new Date();
    const base = activeAnnouncementWhere(now);
    const whereClause = and(
      base,
      eq(announcements.isTicker, true),
    ) as SQL;

    const rows = await fastify.db
      .select({
        id: announcements.id,
        slug: announcements.slug,
        title: announcements.title,
        body: announcements.body,
        priority: announcements.priority,
        publishedAt: announcements.publishedAt,
        expiresAt: announcements.expiresAt,
      })
      .from(announcements)
      .where(whereClause)
      .orderBy(desc(announcements.priority), desc(announcements.publishedAt));

    return reply.send({ data: rows });
  });

  fastify.get("/announcements", async (req, reply) => {
    const parsed = listQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return reply.status(400).send({
        error: {
          code: "VALIDATION_ERROR",
          message: "Geçersiz sorgu parametreleri",
          details: parsed.error.flatten().fieldErrors,
        },
      });
    }

    const { limit, offset } = parsed.data;
    const now = new Date();
    const whereClause = activeAnnouncementWhere(now);

    const [countRow] = await fastify.db
      .select({ total: count() })
      .from(announcements)
      .where(whereClause);

    const rows = await fastify.db
      .select({
        id: announcements.id,
        slug: announcements.slug,
        title: announcements.title,
        body: announcements.body,
        isTicker: announcements.isTicker,
        priority: announcements.priority,
        publishedAt: announcements.publishedAt,
        expiresAt: announcements.expiresAt,
      })
      .from(announcements)
      .where(whereClause)
      .orderBy(desc(announcements.publishedAt))
      .limit(limit)
      .offset(offset);

    return reply.send({
      data: rows,
      meta: {
        total: Number(countRow?.total ?? 0),
        limit,
        offset,
      },
    });
  });

  fastify.get("/announcements/:slug", async (req, reply) => {
    const params = slugParamSchema.safeParse(req.params);
    if (!params.success) {
      return reply.status(400).send({
        error: {
          code: "VALIDATION_ERROR",
          message: "Geçersiz duyuru adresi",
        },
      });
    }
    const slug = params.data.slug;
    const now = new Date();

    const whereClause = and(
      activeAnnouncementWhere(now),
      eq(announcements.slug, slug),
    ) as SQL;

    const [row] = await fastify.db
      .select()
      .from(announcements)
      .where(whereClause)
      .limit(1);

    if (!row) {
      return reply.status(404).send({
        error: { code: "NOT_FOUND", message: "Duyuru bulunamadı." },
      });
    }
    return reply.send({ data: row });
  });
}
