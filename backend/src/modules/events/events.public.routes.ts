import type { FastifyInstance } from "fastify";
import {
  and,
  count,
  desc,
  eq,
  isNull,
  type SQL,
} from "drizzle-orm";
import { z } from "zod";
import { events } from "../../db/schema/index.js";
import { publicEventWhenFilter } from "./events.admin.service.js";
import { publicEventsListQuerySchema } from "./events.admin.schema.js";
import { isValidSlug } from "../../lib/slug.js";

const slugParamSchema = z.object({
  slug: z
    .string()
    .min(1)
    .max(255)
    .refine((s) => isValidSlug(s), "invalid_slug"),
});

export async function publicEventsPlugin(fastify: FastifyInstance) {
  fastify.get("/events", async (req, reply) => {
    const parsed = publicEventsListQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return reply.status(400).send({
        error: {
          code: "VALIDATION_ERROR",
          details: parsed.error.flatten().fieldErrors,
        },
      });
    }
    const { limit, offset, when } = parsed.data;
    const now = new Date();
    const whereClause = publicEventWhenFilter(when, now) as SQL;

    const [countRow] = await fastify.db
      .select({ total: count() })
      .from(events)
      .where(whereClause);

    const rows = await fastify.db
      .select({
        id: events.id,
        slug: events.slug,
        title: events.title,
        description: events.description,
        location: events.location,
        startsAt: events.startsAt,
        endsAt: events.endsAt,
        coverImage: events.coverImage,
        registrationOpen: events.registrationOpen,
        isStakeholder: events.isStakeholder,
        statusLabel: events.statusLabel,
      })
      .from(events)
      .where(whereClause)
      .orderBy(desc(events.startsAt))
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

  fastify.get("/events/:slug", async (req, reply) => {
    const params = slugParamSchema.safeParse(req.params);
    if (!params.success) {
      return reply.status(400).send({
        error: { code: "VALIDATION_ERROR", message: "Geçersiz adres" },
      });
    }
    const whereClause = and(
      isNull(events.deletedAt),
      eq(events.isPublished, true),
      eq(events.slug, params.data.slug),
    ) as SQL;

    const [row] = await fastify.db
      .select()
      .from(events)
      .where(whereClause)
      .limit(1);

    if (!row) {
      return reply.status(404).send({
        error: { code: "NOT_FOUND", message: "Etkinlik bulunamadı." },
      });
    }
    return reply.send({ data: row });
  });
}
