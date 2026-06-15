import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { isValidSlug } from "../../lib/slug.js";
import {
  getPublishedCorporateDocument,
  listPublishedCorporateDocuments,
  sendCorporateDocumentDownload,
} from "./corporate.documents.service.js";

const slugParamSchema = z.object({
  slug: z
    .string()
    .min(1)
    .max(120)
    .refine((s) => isValidSlug(s), "invalid_slug"),
});

export async function publicCorporateDocumentsRoutes(fastify: FastifyInstance) {
  fastify.get("/corporate/documents", async (_req, reply) => {
    const rows = await listPublishedCorporateDocuments(fastify.db);
    return reply.send({ data: rows, meta: { total: rows.length } });
  });

  fastify.get("/corporate/documents/:slug", async (req, reply) => {
    const params = slugParamSchema.safeParse(req.params);
    if (!params.success) {
      return reply.status(400).send({
        error: { code: "VALIDATION_ERROR", message: "Geçersiz adres" },
      });
    }
    const row = await getPublishedCorporateDocument(
      fastify.db,
      params.data.slug,
    );
    if (!row) {
      return reply.status(404).send({
        error: { code: "NOT_FOUND", message: "Belge bulunamadı." },
      });
    }
    return reply.send({ data: row });
  });

  fastify.get<{ Params: { slug: string }; Querystring: { inline?: string } }>(
    "/corporate/documents/:slug/download",
    async (req, reply) => {
      const params = slugParamSchema.safeParse(req.params);
      if (!params.success) {
        return reply.status(400).send({
          error: { code: "VALIDATION_ERROR", message: "Geçersiz adres" },
        });
      }
      const inline = req.query.inline === "1" || req.query.inline === "true";
      return sendCorporateDocumentDownload(
        fastify.db,
        fastify.config,
        params.data.slug,
        reply,
        { inline },
      );
    },
  );
}
