import type { FastifyInstance, FastifyReply } from "fastify";
import { getClientIp } from "../../lib/clientIp.js";
import { assertSuperAdmin } from "../../plugins/adminAuth.js";
import { writeAudit } from "../../lib/audit.js";
import { bumpNewsCacheRevision } from "../../lib/newsCache.js";
import {
  createNews,
  hardDeleteNews,
  listNewsAdmin,
  patchNews,
  publishNews,
  getNewsByIdAdmin,
  softDeleteNews,
  unpublishNews,
} from "./news.admin.service.js";
import {
  adminNewsListQuerySchema,
  createNewsBodySchema,
  newsIdParamsSchema,
  patchNewsBodySchema,
} from "./news.admin.schema.js";

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
          message: "Bu haber arşivlendi; önce geri yükleyin.",
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
          message: "Kapak görseli bulunamadı.",
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

export async function adminNewsPlugin(fastify: FastifyInstance) {
  fastify.addHook("preHandler", fastify.requireAdminAuth);

  fastify.get("/", async (req, reply) => {
    const parsed = adminNewsListQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return reply.status(400).send({
        error: {
          code: "VALIDATION_ERROR",
          message: "Geçersiz sorgu parametreleri",
          details: parsed.error.flatten().fieldErrors,
        },
      });
    }
    const p = parsed.data;
    const { rows, total } = await listNewsAdmin(fastify.db, {
      limit: p.limit,
      offset: p.offset,
      scope: p.scope,
      q: p.q,
    });
    return reply.send({
      data: rows,
      meta: { total, limit: p.limit, offset: p.offset },
    });
  });

  fastify.post("/", async (req, reply) => {
    const body = createNewsBodySchema.safeParse(req.body);
    if (!body.success) {
      return reply.status(400).send({
        error: {
          code: "VALIDATION_ERROR",
          message: "Geçersiz gövde",
          details: body.error!.flatten().fieldErrors,
        },
      });
    }
    const adminId = req.adminAuth!.sub;
    const result = await createNews(fastify.db, adminId, body.data);
    if (!result.ok) return mapServiceError(reply, result.code);

    await writeAudit(fastify.db, {
      adminId,
      action: "news.create",
      entityType: "news",
      entityId: result.row.id,
      diff: { after: { slug: result.row.slug, title: result.row.title } },
      ip: getClientIp(req),
    });
    await bumpNewsCacheRevision(fastify.redis, fastify.config.redisPrefix);

    return reply.status(201).send({ data: result.row });
  });

  fastify.get("/:id", async (req, reply) => {
    const params = newsIdParamsSchema.safeParse(req.params);
    if (!params.success) {
      return reply.status(400).send({
        error: { code: "VALIDATION_ERROR", message: "Geçersiz kimlik" },
      });
    }
    const row = await getNewsByIdAdmin(fastify.db, params.data.id);
    if (!row) {
      return reply.status(404).send({
        error: { code: "NOT_FOUND", message: "Kayıt bulunamadı." },
      });
    }
    return reply.send({ data: row });
  });

  fastify.patch("/:id", async (req, reply) => {
    const params = newsIdParamsSchema.safeParse(req.params);
    const body = patchNewsBodySchema.safeParse(req.body);
    if (!params.success || !body.success) {
      return reply.status(400).send({
        error: {
          code: "VALIDATION_ERROR",
          message: "Geçersiz istek",
          details: !params.success
            ? params.error.flatten().fieldErrors
            : body.error!.flatten().fieldErrors,
        },
      });
    }
    const adminId = req.adminAuth!.sub;
    const result = await patchNews(
      fastify.db,
      params.data.id,
      adminId,
      body.data,
    );
    if (!result.ok) return mapServiceError(reply, result.code);

    await writeAudit(fastify.db, {
      adminId,
      action: "news.update",
      entityType: "news",
      entityId: result.row.id,
      diff: { patch: body.data },
      ip: getClientIp(req),
    });
    await bumpNewsCacheRevision(fastify.redis, fastify.config.redisPrefix);

    return reply.send({ data: result.row });
  });

  fastify.post("/:id/publish", async (req, reply) => {
    const params = newsIdParamsSchema.safeParse(req.params);
    if (!params.success) {
      return reply.status(400).send({
        error: { code: "VALIDATION_ERROR", message: "Geçersiz kimlik" },
      });
    }
    const adminId = req.adminAuth!.sub;
    const result = await publishNews(fastify.db, params.data.id, adminId);
    if (!result.ok) return mapServiceError(reply, result.code);

    await writeAudit(fastify.db, {
      adminId,
      action: "news.publish",
      entityType: "news",
      entityId: result.row.id,
      ip: getClientIp(req),
    });
    await bumpNewsCacheRevision(fastify.redis, fastify.config.redisPrefix);

    return reply.send({ data: result.row });
  });

  fastify.post("/:id/unpublish", async (req, reply) => {
    const params = newsIdParamsSchema.safeParse(req.params);
    if (!params.success) {
      return reply.status(400).send({
        error: { code: "VALIDATION_ERROR", message: "Geçersiz kimlik" },
      });
    }
    const adminId = req.adminAuth!.sub;
    const result = await unpublishNews(fastify.db, params.data.id, adminId);
    if (!result.ok) return mapServiceError(reply, result.code);

    await writeAudit(fastify.db, {
      adminId,
      action: "news.unpublish",
      entityType: "news",
      entityId: result.row.id,
      ip: getClientIp(req),
    });
    await bumpNewsCacheRevision(fastify.redis, fastify.config.redisPrefix);

    return reply.send({ data: result.row });
  });

  fastify.delete("/:id", async (req, reply) => {
    const params = newsIdParamsSchema.safeParse(req.params);
    if (!params.success) {
      return reply.status(400).send({
        error: { code: "VALIDATION_ERROR", message: "Geçersiz kimlik" },
      });
    }
    const adminId = req.adminAuth!.sub;
    const result = await softDeleteNews(fastify.db, params.data.id, adminId);
    if (!result.ok) return mapServiceError(reply, result.code);

    await writeAudit(fastify.db, {
      adminId,
      action: "news.soft_delete",
      entityType: "news",
      entityId: result.row.id,
      ip: getClientIp(req),
    });
    await bumpNewsCacheRevision(fastify.redis, fastify.config.redisPrefix);

    return reply.send({ data: result.row });
  });

  fastify.delete("/:id/permanent", async (req, reply) => {
    if (!(await assertSuperAdmin(req, reply))) return;
    const params = newsIdParamsSchema.safeParse(req.params);
    if (!params.success) {
      return reply.status(400).send({
        error: { code: "VALIDATION_ERROR", message: "Geçersiz kimlik" },
      });
    }
    const adminId = req.adminAuth!.sub;
    const removed = await hardDeleteNews(fastify.db, params.data.id);
    if (!removed) {
      return reply.status(404).send({
        error: { code: "NOT_FOUND", message: "Kayıt bulunamadı." },
      });
    }

    await writeAudit(fastify.db, {
      adminId,
      action: "news.hard_delete",
      entityType: "news",
      entityId: removed.id,
      ip: getClientIp(req),
    });
    await bumpNewsCacheRevision(fastify.redis, fastify.config.redisPrefix);

    return reply.status(204).send();
  });
}
