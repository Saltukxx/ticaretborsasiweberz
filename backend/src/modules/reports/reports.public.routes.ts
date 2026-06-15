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
import { media, reports } from "../../db/schema/index.js";
import { isValidSlug } from "../../lib/slug.js";
import { publicReportsListQuerySchema } from "./reports.admin.schema.js";
import { sendReportPdfDownload } from "./reports.download.js";

const slugParamSchema = z.object({
  slug: z
    .string()
    .min(1)
    .max(255)
    .refine((s) => isValidSlug(s), "invalid_slug"),
});

export async function publicReportsPlugin(fastify: FastifyInstance) {
  fastify.get("/reports", async (req, reply) => {
    const parsed = publicReportsListQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return reply.status(400).send({
        error: {
          code: "VALIDATION_ERROR",
          details: parsed.error.flatten().fieldErrors,
        },
      });
    }
    const { limit, offset, type } = parsed.data;

    const parts: SQL[] = [
      isNull(reports.deletedAt),
      eq(reports.isPublished, true),
    ];
    if (type) parts.push(eq(reports.type, type));
    const whereClause = and(...parts) as SQL;

    const [countRow] = await fastify.db
      .select({ total: count() })
      .from(reports)
      .where(whereClause);

    const rows = await fastify.db
      .select({
        id: reports.id,
        slug: reports.slug,
        name: reports.name,
        summary: reports.summary,
        type: reports.type,
        periodLabel: reports.periodLabel,
        reportDate: reports.reportDate,
      })
      .from(reports)
      .where(whereClause)
      .orderBy(desc(reports.reportDate))
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

  fastify.get<{ Params: { slug: string }; Querystring: { inline?: string } }>(
    "/reports/:slug/download",
    async (req, reply) => {
      const params = slugParamSchema.safeParse(req.params);
      if (!params.success) {
        return reply.status(400).send({
          error: { code: "VALIDATION_ERROR", message: "Geçersiz adres" },
        });
      }
      const inline = req.query.inline === "1" || req.query.inline === "true";
      return sendReportPdfDownload(
        fastify.db,
        fastify.config,
        params.data.slug,
        reply,
        { inline },
      );
    },
  );

  fastify.get("/reports/:slug", async (req, reply) => {
    const params = slugParamSchema.safeParse(req.params);
    if (!params.success) {
      return reply.status(400).send({
        error: { code: "VALIDATION_ERROR", message: "Geçersiz adres" },
      });
    }

    const whereClause = and(
      isNull(reports.deletedAt),
      eq(reports.isPublished, true),
      eq(reports.slug, params.data.slug),
    );

    const [row] = await fastify.db
      .select({
        id: reports.id,
        slug: reports.slug,
        name: reports.name,
        summary: reports.summary,
        type: reports.type,
        periodLabel: reports.periodLabel,
        reportDate: reports.reportDate,
        fileId: reports.fileId,
        fileUrl: media.publicUrl,
        fileMimeType: media.mimeType,
        fileOriginalName: media.originalName,
      })
      .from(reports)
      .innerJoin(media, eq(reports.fileId, media.id))
      .where(whereClause)
      .limit(1);

    if (!row) {
      return reply.status(404).send({
        error: { code: "NOT_FOUND", message: "Rapor bulunamadı." },
      });
    }
    return reply.send({ data: row });
  });
}
