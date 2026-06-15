import type { FastifyInstance, FastifyReply } from "fastify";
import { getClientIp } from "../../lib/clientIp.js";
import { writeAudit } from "../../lib/audit.js";
import {
  createLeadership,
  deleteLeadership,
  getLeadershipByIdAdmin,
  getPresidentLeadershipAdmin,
  listLeadershipAdmin,
  patchLeadership,
  upsertPresidentLeadership,
} from "./leadership.admin.service.js";
import {
  createLeadershipBodySchema,
  leadershipIdParamsSchema,
  leadershipListQuerySchema,
  patchLeadershipBodySchema,
  upsertPresidentBodySchema,
} from "./leadership.admin.schema.js";

function mapServiceError(
  reply: FastifyReply,
  code: "NOT_FOUND" | "ROLE_KEY_TAKEN" | "MEDIA_NOT_FOUND" | "PRESIDENT_PROTECTED",
) {
  switch (code) {
    case "NOT_FOUND":
      return reply.status(404).send({
        error: { code: "NOT_FOUND", message: "Kayıt bulunamadı." },
      });
    case "PRESIDENT_PROTECTED":
      return reply.status(403).send({
        error: {
          code: "PRESIDENT_PROTECTED",
          message: "Başkan kaydı silinemez. Pasifleştirmek için düzenleme kullanın.",
        },
      });
    case "ROLE_KEY_TAKEN":
      return reply.status(409).send({
        error: {
          code: "ROLE_KEY_TAKEN",
          message: "Bu rol anahtarı zaten kullanılıyor.",
        },
      });
    case "MEDIA_NOT_FOUND":
      return reply.status(400).send({
        error: {
          code: "MEDIA_NOT_FOUND",
          message: "Portre görseli bulunamadı.",
        },
      });
    default:
      return reply.status(400).send({
        error: { code: "BAD_REQUEST", message: "İstek geçersiz." },
      });
  }
}

export async function adminLeadershipPlugin(fastify: FastifyInstance) {
  fastify.addHook("preHandler", fastify.requireAdminAuth);

  fastify.get("/", async (req, reply) => {
    const parsed = leadershipListQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return reply.status(400).send({
        error: {
          code: "VALIDATION_ERROR",
          details: parsed.error.flatten().fieldErrors,
        },
      });
    }
    const p = parsed.data;
    const { rows, total } = await listLeadershipAdmin(fastify.db, {
      limit: p.limit,
      offset: p.offset,
      active: p.active,
      groupKey: p.groupKey,
      q: p.q,
    });
    return reply.send({
      data: rows,
      meta: { total, limit: p.limit, offset: p.offset },
    });
  });

  fastify.post("/", async (req, reply) => {
    const body = createLeadershipBodySchema.safeParse(req.body);
    if (!body.success) {
      return reply.status(400).send({
        error: {
          code: "VALIDATION_ERROR",
          details: body.error!.flatten().fieldErrors,
        },
      });
    }
    const adminId = req.adminAuth!.sub;
    const result = await createLeadership(fastify.db, body.data);
    if (!result.ok) return mapServiceError(reply, result.code);

    await writeAudit(fastify.db, {
      adminId,
      action: "leadership.create",
      entityType: "leadership",
      entityId: result.row.id,
      diff: { after: { roleKey: result.row.roleKey } },
      ip: getClientIp(req),
    });

    return reply.status(201).send({ data: result.row });
  });

  fastify.get("/president", async (_req, reply) => {
    const row = await getPresidentLeadershipAdmin(fastify.db);
    if (!row) {
      return reply.status(404).send({
        error: { code: "NOT_FOUND", message: "Başkan kaydı bulunamadı." },
      });
    }
    return reply.send({
      data: {
        ...row,
        updatedAt: row.updatedAt.toISOString(),
      },
    });
  });

  fastify.patch("/president", async (req, reply) => {
    const body = upsertPresidentBodySchema.safeParse(req.body);
    if (!body.success) {
      return reply.status(400).send({
        error: {
          code: "VALIDATION_ERROR",
          details: body.error.flatten().fieldErrors,
        },
      });
    }
    const adminId = req.adminAuth!.sub;
    const result = await upsertPresidentLeadership(fastify.db, body.data);
    if (!result.ok) return mapServiceError(reply, result.code);

    await writeAudit(fastify.db, {
      adminId,
      action: "leadership.president.upsert",
      entityType: "leadership",
      entityId: result.row.id,
      diff: { patch: body.data },
      ip: getClientIp(req),
    });

    const row = await getPresidentLeadershipAdmin(fastify.db);
    if (!row) {
      return reply.status(404).send({
        error: { code: "NOT_FOUND", message: "Başkan kaydı bulunamadı." },
      });
    }
    return reply.send({
      data: { ...row, updatedAt: row.updatedAt.toISOString() },
    });
  });

  fastify.get("/:id", async (req, reply) => {
    const params = leadershipIdParamsSchema.safeParse(req.params);
    if (!params.success) {
      return reply.status(400).send({ error: { code: "VALIDATION_ERROR" } });
    }
    const row = await getLeadershipByIdAdmin(fastify.db, params.data.id);
    if (!row) {
      return reply.status(404).send({
        error: { code: "NOT_FOUND", message: "Kayıt bulunamadı." },
      });
    }
    return reply.send({ data: row });
  });

  fastify.patch("/:id", async (req, reply) => {
    const params = leadershipIdParamsSchema.safeParse(req.params);
    const body = patchLeadershipBodySchema.safeParse(req.body);
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
    const result = await patchLeadership(
      fastify.db,
      params.data.id,
      body.data,
    );
    if (!result.ok) return mapServiceError(reply, result.code);

    await writeAudit(fastify.db, {
      adminId,
      action: "leadership.update",
      entityType: "leadership",
      entityId: result.row.id,
      diff: { patch: body.data },
      ip: getClientIp(req),
    });

    return reply.send({ data: result.row });
  });

  fastify.delete("/:id", async (req, reply) => {
    const params = leadershipIdParamsSchema.safeParse(req.params);
    if (!params.success) {
      return reply.status(400).send({
        error: { code: "VALIDATION_ERROR", message: "Geçersiz kimlik" },
      });
    }
    const adminId = req.adminAuth!.sub;
    const removed = await deleteLeadership(fastify.db, params.data.id);
    if (!removed.ok) {
      if (removed.code === "PRESIDENT_PROTECTED") {
        return mapServiceError(reply, removed.code);
      }
      return reply.status(404).send({
        error: { code: "NOT_FOUND", message: "Kayıt bulunamadı." },
      });
    }

    await writeAudit(fastify.db, {
      adminId,
      action: "leadership.delete",
      entityType: "leadership",
      entityId: removed.id,
      ip: getClientIp(req),
    });

    return reply.status(204).send();
  });
}
