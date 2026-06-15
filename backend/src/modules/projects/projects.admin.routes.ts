import type { FastifyInstance, FastifyReply } from "fastify";
import { getClientIp } from "../../lib/clientIp.js";
import { assertSuperAdmin } from "../../plugins/adminAuth.js";
import { writeAudit } from "../../lib/audit.js";
import {
  createProject,
  getProjectByIdAdmin,
  hardDeleteProject,
  listProjectsAdmin,
  patchProject,
  publishProject,
  softDeleteProject,
  unpublishProject,
} from "./projects.admin.service.js";
import {
  createProjectBodySchema,
  patchProjectBodySchema,
  projectIdParamsSchema,
  projectsListQuerySchema,
} from "./projects.admin.schema.js";

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
          message: "Bu proje arşivlendi.",
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

export async function adminProjectsPlugin(fastify: FastifyInstance) {
  fastify.addHook("preHandler", fastify.requireAdminAuth);

  fastify.get("/", async (req, reply) => {
    const parsed = projectsListQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return reply.status(400).send({
        error: {
          code: "VALIDATION_ERROR",
          details: parsed.error.flatten().fieldErrors,
        },
      });
    }
    const p = parsed.data;
    const { rows, total } = await listProjectsAdmin(fastify.db, {
      limit: p.limit,
      offset: p.offset,
      scope: p.scope,
      status: p.status,
      q: p.q,
    });
    return reply.send({
      data: rows,
      meta: { total, limit: p.limit, offset: p.offset },
    });
  });

  fastify.post("/", async (req, reply) => {
    const body = createProjectBodySchema.safeParse(req.body);
    if (!body.success) {
      return reply.status(400).send({
        error: {
          code: "VALIDATION_ERROR",
          details: body.error!.flatten().fieldErrors,
        },
      });
    }
    const adminId = req.adminAuth!.sub;
    const result = await createProject(fastify.db, adminId, body.data);
    if (!result.ok) return mapServiceError(reply, result.code);

    await writeAudit(fastify.db, {
      adminId,
      action: "projects.create",
      entityType: "projects",
      entityId: result.row.id,
      diff: { after: { slug: result.row.slug } },
      ip: getClientIp(req),
    });

    return reply.status(201).send({ data: result.row });
  });

  fastify.get("/:id", async (req, reply) => {
    const params = projectIdParamsSchema.safeParse(req.params);
    if (!params.success) {
      return reply.status(400).send({ error: { code: "VALIDATION_ERROR" } });
    }
    const row = await getProjectByIdAdmin(fastify.db, params.data.id);
    if (!row) {
      return reply.status(404).send({
        error: { code: "NOT_FOUND", message: "Kayıt bulunamadı." },
      });
    }
    return reply.send({ data: row });
  });

  fastify.patch("/:id", async (req, reply) => {
    const params = projectIdParamsSchema.safeParse(req.params);
    const body = patchProjectBodySchema.safeParse(req.body);
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
    const result = await patchProject(fastify.db, params.data.id, body.data);
    if (!result.ok) return mapServiceError(reply, result.code);

    await writeAudit(fastify.db, {
      adminId,
      action: "projects.update",
      entityType: "projects",
      entityId: result.row.id,
      diff: { patch: body.data },
      ip: getClientIp(req),
    });

    return reply.send({ data: result.row });
  });

  fastify.post("/:id/publish", async (req, reply) => {
    const params = projectIdParamsSchema.safeParse(req.params);
    if (!params.success) {
      return reply.status(400).send({
        error: { code: "VALIDATION_ERROR", message: "Geçersiz kimlik" },
      });
    }
    const adminId = req.adminAuth!.sub;
    const result = await publishProject(fastify.db, params.data.id);
    if (!result.ok) return mapServiceError(reply, result.code);

    await writeAudit(fastify.db, {
      adminId,
      action: "projects.publish",
      entityType: "projects",
      entityId: result.row.id,
      ip: getClientIp(req),
    });

    return reply.send({ data: result.row });
  });

  fastify.post("/:id/unpublish", async (req, reply) => {
    const params = projectIdParamsSchema.safeParse(req.params);
    if (!params.success) {
      return reply.status(400).send({
        error: { code: "VALIDATION_ERROR", message: "Geçersiz kimlik" },
      });
    }
    const adminId = req.adminAuth!.sub;
    const result = await unpublishProject(fastify.db, params.data.id);
    if (!result.ok) return mapServiceError(reply, result.code);

    await writeAudit(fastify.db, {
      adminId,
      action: "projects.unpublish",
      entityType: "projects",
      entityId: result.row.id,
      ip: getClientIp(req),
    });

    return reply.send({ data: result.row });
  });

  fastify.delete("/:id", async (req, reply) => {
    const params = projectIdParamsSchema.safeParse(req.params);
    if (!params.success) {
      return reply.status(400).send({
        error: { code: "VALIDATION_ERROR", message: "Geçersiz kimlik" },
      });
    }
    const adminId = req.adminAuth!.sub;
    const result = await softDeleteProject(fastify.db, params.data.id);
    if (!result.ok) return mapServiceError(reply, result.code);

    await writeAudit(fastify.db, {
      adminId,
      action: "projects.soft_delete",
      entityType: "projects",
      entityId: result.row.id,
      ip: getClientIp(req),
    });

    return reply.send({ data: result.row });
  });

  fastify.delete("/:id/permanent", async (req, reply) => {
    if (!(await assertSuperAdmin(req, reply))) return;
    const params = projectIdParamsSchema.safeParse(req.params);
    if (!params.success) {
      return reply.status(400).send({
        error: { code: "VALIDATION_ERROR", message: "Geçersiz kimlik" },
      });
    }
    const adminId = req.adminAuth!.sub;
    const removed = await hardDeleteProject(fastify.db, params.data.id);
    if (!removed) {
      return reply.status(404).send({
        error: { code: "NOT_FOUND", message: "Kayıt bulunamadı." },
      });
    }

    await writeAudit(fastify.db, {
      adminId,
      action: "projects.hard_delete",
      entityType: "projects",
      entityId: removed.id,
      ip: getClientIp(req),
    });

    return reply.status(204).send();
  });
}
