import type { FastifyInstance, FastifyReply } from "fastify";
import { getClientIp } from "../../lib/clientIp.js";
import { writeAudit } from "../../lib/audit.js";
import {
  createGeo,
  deleteGeo,
  getGeoByIdAdmin,
  listGeoAdmin,
  patchGeo,
} from "./geographicalIndications.admin.service.js";
import {
  createGeoBodySchema,
  geoIdParamsSchema,
  geoListQuerySchema,
  patchGeoBodySchema,
} from "./geographicalIndications.admin.schema.js";

function mapServiceError(
  reply: FastifyReply,
  code: "NOT_FOUND" | "SLUG_TAKEN" | "INVALID_SLUG" | "MEDIA_NOT_FOUND",
) {
  switch (code) {
    case "NOT_FOUND":
      return reply.status(404).send({
        error: { code: "NOT_FOUND", message: "Kayıt bulunamadı." },
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
    default:
      return reply.status(400).send({
        error: { code: "BAD_REQUEST", message: "İstek geçersiz." },
      });
  }
}

export async function adminGeoIndicationsPlugin(fastify: FastifyInstance) {
  fastify.addHook("preHandler", fastify.requireAdminAuth);

  fastify.get("/", async (req, reply) => {
    const parsed = geoListQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return reply.status(400).send({
        error: {
          code: "VALIDATION_ERROR",
          details: parsed.error.flatten().fieldErrors,
        },
      });
    }
    const p = parsed.data;
    const { rows, total } = await listGeoAdmin(fastify.db, {
      limit: p.limit,
      offset: p.offset,
      active: p.active,
      category: p.category,
      q: p.q,
    });
    return reply.send({
      data: rows,
      meta: { total, limit: p.limit, offset: p.offset },
    });
  });

  fastify.post("/", async (req, reply) => {
    const body = createGeoBodySchema.safeParse(req.body);
    if (!body.success) {
      return reply.status(400).send({
        error: {
          code: "VALIDATION_ERROR",
          details: body.error!.flatten().fieldErrors,
        },
      });
    }
    const adminId = req.adminAuth!.sub;
    const result = await createGeo(fastify.db, body.data);
    if (!result.ok) return mapServiceError(reply, result.code);

    await writeAudit(fastify.db, {
      adminId,
      action: "geographical_indications.create",
      entityType: "geographical_indications",
      entityId: result.row.id,
      diff: { after: { slug: result.row.slug } },
      ip: getClientIp(req),
    });

    return reply.status(201).send({ data: result.row });
  });

  fastify.get("/:id", async (req, reply) => {
    const params = geoIdParamsSchema.safeParse(req.params);
    if (!params.success) {
      return reply.status(400).send({ error: { code: "VALIDATION_ERROR" } });
    }
    const row = await getGeoByIdAdmin(fastify.db, params.data.id);
    if (!row) {
      return reply.status(404).send({
        error: { code: "NOT_FOUND", message: "Kayıt bulunamadı." },
      });
    }
    return reply.send({ data: row });
  });

  fastify.patch("/:id", async (req, reply) => {
    const params = geoIdParamsSchema.safeParse(req.params);
    const body = patchGeoBodySchema.safeParse(req.body);
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
    const result = await patchGeo(fastify.db, params.data.id, body.data);
    if (!result.ok) return mapServiceError(reply, result.code);

    await writeAudit(fastify.db, {
      adminId,
      action: "geographical_indications.update",
      entityType: "geographical_indications",
      entityId: result.row.id,
      diff: { patch: body.data },
      ip: getClientIp(req),
    });

    return reply.send({ data: result.row });
  });

  fastify.delete("/:id", async (req, reply) => {
    const params = geoIdParamsSchema.safeParse(req.params);
    if (!params.success) {
      return reply.status(400).send({
        error: { code: "VALIDATION_ERROR", message: "Geçersiz kimlik" },
      });
    }
    const adminId = req.adminAuth!.sub;
    const removed = await deleteGeo(fastify.db, params.data.id);
    if (!removed) {
      return reply.status(404).send({
        error: { code: "NOT_FOUND", message: "Kayıt bulunamadı." },
      });
    }

    await writeAudit(fastify.db, {
      adminId,
      action: "geographical_indications.delete",
      entityType: "geographical_indications",
      entityId: removed.id,
      ip: getClientIp(req),
    });

    return reply.status(204).send();
  });
}
