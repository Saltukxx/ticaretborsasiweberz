import type { FastifyInstance } from "fastify";
import {
  and,
  count,
  desc,
  eq,
  isNotNull,
  isNull,
  sql,
  type SQL,
} from "drizzle-orm";
import { z } from "zod";
import { media, news } from "../../db/schema/index.js";

const publicNewsListColumns = {
  id: news.id,
  slug: news.slug,
  title: news.title,
  excerpt: news.excerpt,
  category: news.category,
  tone: news.tone,
  isFeatured: news.isFeatured,
  coverImage: news.coverImage,
  coverUrl: media.publicUrl,
  publishedAt: news.publishedAt,
};

function escapeLike(s: string): string {
  return s.replace(/[%_\\]/g, "\\$&");
}

const listQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
  category: z.string().max(100).optional(),
});

const searchQuerySchema = z.object({
  q: z.string().min(1).max(200),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
  category: z.string().max(100).optional(),
});

const slugParamSchema = z.object({
  slug: z
    .string()
    .min(1)
    .max(255)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
});

export async function publicNewsPlugin(fastify: FastifyInstance) {
  fastify.get("/news", async (req, reply) => {
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

    const { limit, offset, category } = parsed.data;

    const filters: SQL[] = [
      isNull(news.deletedAt),
      isNotNull(news.publishedAt),
    ];
    if (category) {
      filters.push(eq(news.category, category));
    }
    const whereClause = and(...filters);

    const [countRow] = await fastify.db
      .select({ total: count() })
      .from(news)
      .where(whereClause);

    const rows = await fastify.db
      .select(publicNewsListColumns)
      .from(news)
      .leftJoin(media, eq(news.coverImage, media.id))
      .where(whereClause)
      .orderBy(desc(news.publishedAt))
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

  fastify.get("/news/search", async (req, reply) => {
    const parsed = searchQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return reply.status(400).send({
        error: {
          code: "VALIDATION_ERROR",
          message: "Geçersiz arama parametreleri",
          details: parsed.error.flatten().fieldErrors,
        },
      });
    }

    const { limit, offset, category } = parsed.data;
    const q = parsed.data.q.trim();
    if (q.length < 2) {
      return reply.status(400).send({
        error: {
          code: "VALIDATION_ERROR",
          message: "Arama için en az 2 karakter girin.",
        },
      });
    }

    const ilikeTerm = `%${escapeLike(q)}%`;

    const combinedMatch = sql`(
      ${news.searchVector} @@ plainto_tsquery('turkish', ${q})
      OR ${news.title} ILIKE ${ilikeTerm}
      OR ${news.excerpt} ILIKE ${ilikeTerm}
      OR ${news.body} ILIKE ${ilikeTerm}
    )`;

    const filters: SQL[] = [
      isNull(news.deletedAt),
      isNotNull(news.publishedAt),
      combinedMatch,
    ];
    if (category) {
      filters.push(eq(news.category, category));
    }
    const whereClause = and(...filters);

    const rank = sql`
      CASE
        WHEN ${news.searchVector} @@ plainto_tsquery('turkish', ${q})
        THEN ts_rank_cd(${news.searchVector}, plainto_tsquery('turkish', ${q}))
        ELSE 0.0001
      END
    `.as("rank");

    const [countRow] = await fastify.db
      .select({ total: count() })
      .from(news)
      .where(whereClause);

    const rows = await fastify.db
      .select({ ...publicNewsListColumns, rank })
      .from(news)
      .leftJoin(media, eq(news.coverImage, media.id))
      .where(whereClause)
      .orderBy(desc(rank), desc(news.publishedAt))
      .limit(limit)
      .offset(offset);

    return reply.send({
      data: rows,
      meta: {
        total: Number(countRow?.total ?? 0),
        limit,
        offset,
        q,
      },
    });
  });

  fastify.get("/news/:slug", async (req, reply) => {
    const params = slugParamSchema.safeParse(req.params);
    if (!params.success) {
      return reply.status(400).send({
        error: { code: "VALIDATION_ERROR", message: "Geçersiz haber adresi" },
      });
    }
    const slug = params.data.slug;

    const filters: SQL[] = [
      eq(news.slug, slug),
      isNull(news.deletedAt),
      isNotNull(news.publishedAt),
    ];
    const [row] = await fastify.db
      .select({
        id: news.id,
        slug: news.slug,
        title: news.title,
        excerpt: news.excerpt,
        body: news.body,
        category: news.category,
        tone: news.tone,
        isFeatured: news.isFeatured,
        coverImage: news.coverImage,
        coverUrl: media.publicUrl,
        publishedAt: news.publishedAt,
        createdAt: news.createdAt,
        updatedAt: news.updatedAt,
      })
      .from(news)
      .leftJoin(media, eq(news.coverImage, media.id))
      .where(and(...filters))
      .limit(1);

    if (!row) {
      return reply.status(404).send({
        error: { code: "NOT_FOUND", message: "Haber bulunamadı." },
      });
    }
    return reply.send({ data: row });
  });
}
