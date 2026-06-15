import type { FastifyInstance, FastifyReply } from "fastify";
import { getClientIp } from "../../lib/clientIp.js";
import { writeAudit } from "../../lib/audit.js";
import {
  createService,
  deleteService,
  getServiceByIdAdmin,
  listServicesAdmin,
  patchService,
} from "./services.admin.service.js";
import {
  createServiceBodySchema,
  patchServiceBodySchema,
  serviceIdParamsSchema,
  servicesListQuerySchema,
} from "./services.admin.schema.js";

function mapServiceError(
  reply: FastifyReply,
  code: "NOT_FOUND" | "SLUG_TAKEN" | "INVALID_SLUG",
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
    default:
      return reply.status(400).send({
        error: { code: "BAD_REQUEST", message: "İstek geçersiz." },
      });
  }
}

export async function adminServicesPlugin(fastify: FastifyInstance) {
  fastify.addHook("preHandler", fastify.requireAdminAuth);

  fastify.get("/", async (req, reply) => {
    const parsed = servicesListQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return reply.status(400).send({
        error: {
          code: "VALIDATION_ERROR",
          details: parsed.error.flatten().fieldErrors,
        },
      });
    }
    const p = parsed.data;
    const { rows, total } = await listServicesAdmin(fastify.db, {
      limit: p.limit,
      offset: p.offset,
      active: p.active,
      q: p.q,
    });
    return reply.send({
      data: rows,
      meta: { total, limit: p.limit, offset: p.offset },
    });
  });

  fastify.post("/", async (req, reply) => {
    const body = createServiceBodySchema.safeParse(req.body);
    if (!body.success) {
      return reply.status(400).send({
        error: {
          code: "VALIDATION_ERROR",
          details: body.error!.flatten().fieldErrors,
        },
      });
    }
    const adminId = req.adminAuth!.sub;
    const result = await createService(fastify.db, {
      slug: body.data.slug,
      title: body.data.title,
      description: body.data.description,
      icon: body.data.icon,
      sortOrder: body.data.sortOrder,
      isActive: body.data.isActive,
    });
    if (!result.ok) return mapServiceError(reply, result.code);

    await writeAudit(fastify.db, {
      adminId,
      action: "services.create",
      entityType: "services",
      entityId: result.row.id,
      diff: { after: { slug: result.row.slug } },
      ip: getClientIp(req),
    });

    return reply.status(201).send({ data: result.row });
  });

  fastify.get("/:id", async (req, reply) => {
    const params = serviceIdParamsSchema.safeParse(req.params);
    if (!params.success) {
      return reply.status(400).send({ error: { code: "VALIDATION_ERROR" } });
    }
    const row = await getServiceByIdAdmin(fastify.db, params.data.id);
    if (!row) {
      return reply.status(404).send({
        error: { code: "NOT_FOUND", message: "Kayıt bulunamadı." },
      });
    }
    return reply.send({ data: row });
  });

  fastify.patch("/:id", async (req, reply) => {
    const params = serviceIdParamsSchema.safeParse(req.params);
    const body = patchServiceBodySchema.safeParse(req.body);
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
    const result = await patchService(fastify.db, params.data.id, body.data);
    if (!result.ok) return mapServiceError(reply, result.code);

    await writeAudit(fastify.db, {
      adminId,
      action: "services.update",
      entityType: "services",
      entityId: result.row.id,
      diff: { patch: body.data },
      ip: getClientIp(req),
    });

    return reply.send({ data: result.row });
  });

  fastify.delete("/:id", async (req, reply) => {
    const params = serviceIdParamsSchema.safeParse(req.params);
    if (!params.success) {
      return reply.status(400).send({
        error: { code: "VALIDATION_ERROR", message: "Geçersiz kimlik" },
      });
    }
    const adminId = req.adminAuth!.sub;
    const removed = await deleteService(fastify.db, params.data.id);
    if (!removed) {
      return reply.status(404).send({
        error: { code: "NOT_FOUND", message: "Kayıt bulunamadı." },
      });
    }

    await writeAudit(fastify.db, {
      adminId,
      action: "services.delete",
      entityType: "services",
      entityId: removed.id,
      ip: getClientIp(req),
    });

    return reply.status(204).send();
  });
}
