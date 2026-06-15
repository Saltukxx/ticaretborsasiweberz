import type { FastifyInstance } from "fastify";
import {
  and,
  asc,
  count,
  desc,
  eq,
  type SQL,
} from "drizzle-orm";
import { z } from "zod";
import {
  geographicalIndications,
  media,
} from "../../db/schema/index.js";
import { isValidSlug } from "../../lib/slug.js";
import { publicGeoListQuerySchema } from "./geographicalIndications.admin.schema.js";

const slugParamSchema = z.object({
  slug: z
    .string()
    .min(1)
    .max(255)
    .refine((s) => isValidSlug(s), "invalid_slug"),
});

export async function publicGeoIndicationsPlugin(fastify: FastifyInstance) {
  fastify.get("/geo-indications", async (req, reply) => {
    const parsed = publicGeoListQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return reply.status(400).send({
        error: {
          code: "VALIDATION_ERROR",
          details: parsed.error.flatten().fieldErrors,
        },
      });
    }
    const { limit, offset, category } = parsed.data;

    const parts: SQL[] = [eq(geographicalIndications.isActive, true)];
    if (category) parts.push(eq(geographicalIndications.category, category));
    const whereClause = and(...parts) as SQL;

    const [countRow] = await fastify.db
      .select({ total: count() })
      .from(geographicalIndications)
      .where(whereClause);

    const rows = await fastify.db
      .select({
        id: geographicalIndications.id,
        slug: geographicalIndications.slug,
        name: geographicalIndications.name,
        category: geographicalIndications.category,
        type: geographicalIndications.type,
        registrationNo: geographicalIndications.registrationNo,
        registeredAt: geographicalIndications.registeredAt,
        district: geographicalIndications.district,
        isHighlight: geographicalIndications.isHighlight,
        story: geographicalIndications.story,
        sortOrder: geographicalIndications.sortOrder,
        coverImage: geographicalIndications.coverImage,
        coverUrl: media.publicUrl,
      })
      .from(geographicalIndications)
      .leftJoin(
        media,
        eq(geographicalIndications.coverImage, media.id),
      )
      .where(whereClause)
      .orderBy(
        desc(geographicalIndications.isHighlight),
        asc(geographicalIndications.sortOrder),
        asc(geographicalIndications.name),
      )
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

  fastify.get("/geo-indications/:slug", async (req, reply) => {
    const params = slugParamSchema.safeParse(req.params);
    if (!params.success) {
      return reply.status(400).send({
        error: { code: "VALIDATION_ERROR", message: "Geçersiz adres" },
      });
    }

    const whereClause = and(
      eq(geographicalIndications.isActive, true),
      eq(geographicalIndications.slug, params.data.slug),
    );

    const [row] = await fastify.db
      .select({
        id: geographicalIndications.id,
        slug: geographicalIndications.slug,
        name: geographicalIndications.name,
        category: geographicalIndications.category,
        type: geographicalIndications.type,
        registrationNo: geographicalIndications.registrationNo,
        registeredAt: geographicalIndications.registeredAt,
        district: geographicalIndications.district,
        isHighlight: geographicalIndications.isHighlight,
        story: geographicalIndications.story,
        sortOrder: geographicalIndications.sortOrder,
        coverImage: geographicalIndications.coverImage,
        coverUrl: media.publicUrl,
      })
      .from(geographicalIndications)
      .leftJoin(
        media,
        eq(geographicalIndications.coverImage, media.id),
      )
      .where(whereClause)
      .limit(1);

    if (!row) {
      return reply.status(404).send({
        error: { code: "NOT_FOUND", message: "Kayıt bulunamadı." },
      });
    }
    return reply.send({ data: row });
  });
}
