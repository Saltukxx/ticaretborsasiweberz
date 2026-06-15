import type { FastifyInstance } from "fastify";
import { getClientIp } from "../../lib/clientIp.js";
import multipart from "@fastify/multipart";
import { writeAudit } from "../../lib/audit.js";
import {
  deleteMediaRow,
  getMediaById,
  listMediaAdmin,
  patchMediaAlt,
  uploadMediaPublic,
} from "./media.admin.service.js";
import {
  mediaIdParamsSchema,
  mediaListQuerySchema,
  patchMediaBodySchema,
} from "./media.admin.schema.js";

export async function adminMediaPlugin(fastify: FastifyInstance) {
  await fastify.register(multipart, {
    limits: {
      // PDF raporları için üst sınır (görseller için de geçerli)
      fileSize: 50 * 1024 * 1024,
    },
  });

  fastify.addHook("preHandler", fastify.requireAdminAuth);

  fastify.get("/", async (req, reply) => {
    const parsed = mediaListQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return reply.status(400).send({
        error: {
          code: "VALIDATION_ERROR",
          details: parsed.error.flatten().fieldErrors,
        },
      });
    }
    const p = parsed.data;
    const { rows, total } = await listMediaAdmin(fastify.db, {
      limit: p.limit,
      offset: p.offset,
      q: p.q,
      mimePrefix: p.mimePrefix,
    });
    return reply.send({
      data: rows,
      meta: { total, limit: p.limit, offset: p.offset },
    });
  });

  fastify.post("/upload", async (req, reply) => {
    const data = await req.file();
    if (!data) {
      return reply.status(400).send({
        error: { code: "VALIDATION_ERROR", message: "Dosya gerekli." },
      });
    }
    const buf = await data.toBuffer();
    const adminId = req.adminAuth!.sub;
    const result = await uploadMediaPublic(fastify.db, fastify.config, {
      buffer: buf,
      filename: data.filename || "upload.bin",
      mimetype: data.mimetype,
      adminId,
    });

    if (!result.ok) {
      return reply.status(400).send({
        error: {
          code: "INVALID_FILE",
          message: "İzin verilmeyen dosya türü veya uzantı.",
        },
      });
    }

    await writeAudit(fastify.db, {
      adminId,
      action: "media.upload",
      entityType: "media",
      entityId: result.row.id,
      diff: {
        after: { mime: result.row.mimeType, size: result.row.sizeBytes },
      },
      ip: getClientIp(req),
    });

    return reply.status(201).send({ data: result.row });
  });

  fastify.get("/:id", async (req, reply) => {
    const params = mediaIdParamsSchema.safeParse(req.params);
    if (!params.success) {
      return reply.status(400).send({ error: { code: "VALIDATION_ERROR" } });
    }
    const row = await getMediaById(fastify.db, params.data.id);
    if (!row) {
      return reply.status(404).send({
        error: { code: "NOT_FOUND", message: "Dosya bulunamadı." },
      });
    }
    return reply.send({ data: row });
  });

  fastify.patch("/:id", async (req, reply) => {
    const params = mediaIdParamsSchema.safeParse(req.params);
    const body = patchMediaBodySchema.safeParse(req.body);
    if (!params.success || !body.success) {
      return reply.status(400).send({
        error: {
          code: "VALIDATION_ERROR",
          details: !params.success
            ? params.error.flatten().fieldErrors
            : body.error!.flatten().fieldErrors,
        },
      });
    }
    const adminId = req.adminAuth!.sub;
    const result = await patchMediaAlt(
      fastify.db,
      params.data.id,
      body.data.altText,
    );
    if (!result.ok) {
      return reply.status(404).send({
        error: { code: "NOT_FOUND", message: "Dosya bulunamadı." },
      });
    }

    await writeAudit(fastify.db, {
      adminId,
      action: "media.patch",
      entityType: "media",
      entityId: result.row.id,
      diff: { patch: { altText: body.data.altText } },
      ip: getClientIp(req),
    });

    return reply.send({ data: result.row });
  });

  fastify.delete("/:id", async (req, reply) => {
    const params = mediaIdParamsSchema.safeParse(req.params);
    if (!params.success) {
      return reply.status(400).send({
        error: { code: "VALIDATION_ERROR", message: "Geçersiz kimlik" },
      });
    }
    const adminId = req.adminAuth!.sub;
    const result = await deleteMediaRow(
      fastify.db,
      fastify.config,
      params.data.id,
    );

    if (!result.ok) {
      if (result.code === "IN_USE") {
        return reply.status(409).send({
          error: {
            code: "IN_USE",
            message: "Dosya başka kayıtlarda kullanılıyor.",
          },
        });
      }
      return reply.status(404).send({
        error: { code: "NOT_FOUND", message: "Dosya bulunamadı." },
      });
    }

    await writeAudit(fastify.db, {
      adminId,
      action: "media.delete",
      entityType: "media",
      entityId: params.data.id,
      ip: getClientIp(req),
    });

    return reply.status(204).send();
  });
}
