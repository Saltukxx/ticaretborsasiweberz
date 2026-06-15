import type { FastifyInstance, FastifyReply } from "fastify";
import { getClientIp } from "../../lib/clientIp.js";
import { assertSuperAdmin } from "../../plugins/adminAuth.js";
import { writeAudit } from "../../lib/audit.js";
import {
  createReport,
  getReportByIdAdmin,
  hardDeleteReport,
  listReportsAdmin,
  patchReport,
  publishReport,
  softDeleteReport,
  unpublishReport,
} from "./reports.admin.service.js";
import {
  createReportBodySchema,
  patchReportBodySchema,
  reportIdParamsSchema,
  reportsListQuerySchema,
} from "./reports.admin.schema.js";

function mapServiceError(
  reply: FastifyReply,
  code:
    | "NOT_FOUND"
    | "ARCHIVED"
    | "SLUG_TAKEN"
    | "INVALID_SLUG"
    | "MEDIA_NOT_FOUND"
    | "ALREADY_DELETED",
) {
  switch (code) {
    case "NOT_FOUND":
      return reply.status(404).send({
        error: { code: "NOT_FOUND", message: "Kayıt bulunamadı." },
      });
    case "ARCHIVED":
      return reply.status(409).send({
        error: {
          code: "ARCHIVED",
          message: "Bu rapor arşivlendi.",
        },
      });
    case "SLUG_TAKEN":
      return reply.status(409).send({
        error: {
          code: "SLUG_TAKEN",
          message: "Bu adres (slug) zaten kullanılıyor.",
        },
      });
    case "INVALID_SLUG":
      return reply.status(400).send({
        error: {
          code: "INVALID_SLUG",
          message: "Slug yalnızca küçük harf, rakam ve tire içerebilir.",
        },
      });
    case "MEDIA_NOT_FOUND":
      return reply.status(400).send({
        error: {
          code: "MEDIA_NOT_FOUND",
          message: "PDF dosyası bulunamadı. Medya kütüphanesinden bir PDF seçin.",
        },
      });
    case "ALREADY_DELETED":
      return reply.status(409).send({
        error: {
          code: "ALREADY_DELETED",
          message: "Kayıt zaten silinmiş.",
        },
      });
    default:
      return reply.status(400).send({
        error: { code: "BAD_REQUEST", message: "İstek geçersiz." },
      });
  }
}

export async function adminReportsPlugin(fastify: FastifyInstance) {
  fastify.addHook("preHandler", fastify.requireAdminAuth);

  fastify.get("/", async (req, reply) => {
    const parsed = reportsListQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return reply.status(400).send({
        error: {
          code: "VALIDATION_ERROR",
          details: parsed.error.flatten().fieldErrors,
        },
      });
    }
    const p = parsed.data;
    const { rows, total } = await listReportsAdmin(fastify.db, {
      limit: p.limit,
      offset: p.offset,
      scope: p.scope,
      type: p.type,
      q: p.q,
    });
    return reply.send({
      data: rows,
      meta: { total, limit: p.limit, offset: p.offset },
    });
  });

  fastify.post("/", async (req, reply) => {
    const body = createReportBodySchema.safeParse(req.body);
    if (!body.success) {
      return reply.status(400).send({
        error: {
          code: "VALIDATION_ERROR",
          details: body.error!.flatten().fieldErrors,
        },
      });
    }
    const adminId = req.adminAuth!.sub;
    const result = await createReport(fastify.db, adminId, {
      slug: body.data.slug,
      name: body.data.name,
      summary: body.data.summary,
      type: body.data.type,
      periodLabel: body.data.periodLabel,
      fileId: body.data.fileId,
      reportDate: body.data.reportDate,
      isPublished: body.data.isPublished,
    });
    if (!result.ok) return mapServiceError(reply, result.code);

    await writeAudit(fastify.db, {
      adminId,
      action: "reports.create",
      entityType: "reports",
      entityId: result.row.id,
      diff: { after: { slug: result.row.slug } },
      ip: getClientIp(req),
    });

    return reply.status(201).send({ data: result.row });
  });

  fastify.get("/:id", async (req, reply) => {
    const params = reportIdParamsSchema.safeParse(req.params);
    if (!params.success) {
      return reply.status(400).send({ error: { code: "VALIDATION_ERROR" } });
    }
    const row = await getReportByIdAdmin(fastify.db, params.data.id);
    if (!row) {
      return reply.status(404).send({
        error: { code: "NOT_FOUND", message: "Kayıt bulunamadı." },
      });
    }
    return reply.send({ data: row });
  });

  fastify.patch("/:id", async (req, reply) => {
    const params = reportIdParamsSchema.safeParse(req.params);
    const body = patchReportBodySchema.safeParse(req.body);
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
    const result = await patchReport(fastify.db, params.data.id, body.data);
    if (!result.ok) return mapServiceError(reply, result.code);

    await writeAudit(fastify.db, {
      adminId,
      action: "reports.update",
      entityType: "reports",
      entityId: result.row.id,
      diff: { patch: body.data },
      ip: getClientIp(req),
    });

    return reply.send({ data: result.row });
  });

  fastify.post("/:id/publish", async (req, reply) => {
    const params = reportIdParamsSchema.safeParse(req.params);
    if (!params.success) {
      return reply.status(400).send({
        error: { code: "VALIDATION_ERROR", message: "Geçersiz kimlik" },
      });
    }
    const adminId = req.adminAuth!.sub;
    const result = await publishReport(fastify.db, params.data.id);
    if (!result.ok) return mapServiceError(reply, result.code);

    await writeAudit(fastify.db, {
      adminId,
      action: "reports.publish",
      entityType: "reports",
      entityId: result.row.id,
      ip: getClientIp(req),
    });

    return reply.send({ data: result.row });
  });

  fastify.post("/:id/unpublish", async (req, reply) => {
    const params = reportIdParamsSchema.safeParse(req.params);
    if (!params.success) {
      return reply.status(400).send({
        error: { code: "VALIDATION_ERROR", message: "Geçersiz kimlik" },
      });
    }
    const adminId = req.adminAuth!.sub;
    const result = await unpublishReport(fastify.db, params.data.id);
    if (!result.ok) return mapServiceError(reply, result.code);

    await writeAudit(fastify.db, {
      adminId,
      action: "reports.unpublish",
      entityType: "reports",
      entityId: result.row.id,
      ip: getClientIp(req),
    });

    return reply.send({ data: result.row });
  });

  fastify.delete("/:id", async (req, reply) => {
    const params = reportIdParamsSchema.safeParse(req.params);
    if (!params.success) {
      return reply.status(400).send({
        error: { code: "VALIDATION_ERROR", message: "Geçersiz kimlik" },
      });
    }
    const adminId = req.adminAuth!.sub;
    const result = await softDeleteReport(fastify.db, params.data.id);
    if (!result.ok) return mapServiceError(reply, result.code);

    await writeAudit(fastify.db, {
      adminId,
      action: "reports.soft_delete",
      entityType: "reports",
      entityId: result.row.id,
      ip: getClientIp(req),
    });

    return reply.send({ data: result.row });
  });

  fastify.delete("/:id/permanent", async (req, reply) => {
    if (!(await assertSuperAdmin(req, reply))) return;
    const params = reportIdParamsSchema.safeParse(req.params);
    if (!params.success) {
      return reply.status(400).send({
        error: { code: "VALIDATION_ERROR", message: "Geçersiz kimlik" },
      });
    }
    const adminId = req.adminAuth!.sub;
    const removed = await hardDeleteReport(fastify.db, params.data.id);
    if (!removed) {
      return reply.status(404).send({
        error: { code: "NOT_FOUND", message: "Kayıt bulunamadı." },
      });
    }

    await writeAudit(fastify.db, {
      adminId,
      action: "reports.hard_delete",
      entityType: "reports",
      entityId: removed.id,
      ip: getClientIp(req),
    });

    return reply.status(204).send();
  });
}
