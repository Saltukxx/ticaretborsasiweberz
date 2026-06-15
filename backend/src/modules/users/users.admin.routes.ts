import type { FastifyInstance, FastifyReply } from "fastify";
import { getClientIp } from "../../lib/clientIp.js";
import { writeAudit } from "../../lib/audit.js";
import {
  createUser,
  deleteUser,
  getUserByIdAdmin,
  listUsersAdmin,
  patchUser,
} from "./users.admin.service.js";
import {
  createUserBodySchema,
  patchUserBodySchema,
  userIdParamsSchema,
  usersListQuerySchema,
} from "./users.admin.schema.js";

function mapPatchError(
  reply: FastifyReply,
  code:
    | "NOT_FOUND"
    | "EMAIL_TAKEN"
    | "LAST_SUPER_ADMIN"
    | "LAST_SUPER_ADMIN_DEACTIVATE"
    | "LAST_SUPER_ADMIN_DEMOTE",
) {
  switch (code) {
    case "NOT_FOUND":
      return reply.status(404).send({
        error: { code: "NOT_FOUND", message: "Kayıt bulunamadı." },
      });
    case "EMAIL_TAKEN":
      return reply.status(409).send({
        error: {
          code: "EMAIL_TAKEN",
          message: "Bu e-posta zaten kayıtlı.",
        },
      });
    case "LAST_SUPER_ADMIN":
      return reply.status(409).send({
        error: {
          code: "LAST_SUPER_ADMIN",
          message: "Son süper yönetici silinemez.",
        },
      });
    case "LAST_SUPER_ADMIN_DEACTIVATE":
      return reply.status(409).send({
        error: {
          code: "LAST_SUPER_ADMIN",
          message: "Son süper yönetici pasifleştirilemez.",
        },
      });
    case "LAST_SUPER_ADMIN_DEMOTE":
      return reply.status(409).send({
        error: {
          code: "LAST_SUPER_ADMIN",
          message: "Son süper yöneticinin rolü düşürülemez.",
        },
      });
    default:
      return reply.status(400).send({
        error: { code: "BAD_REQUEST", message: "İstek geçersiz." },
      });
  }
}

export async function adminUsersPlugin(fastify: FastifyInstance) {
  fastify.addHook("preHandler", fastify.requireSuperAdmin);

  fastify.get("/users", async (req, reply) => {
    const parsed = usersListQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return reply.status(400).send({
        error: {
          code: "VALIDATION_ERROR",
          details: parsed.error.flatten().fieldErrors,
        },
      });
    }
    const p = parsed.data;
    const { rows, total } = await listUsersAdmin(fastify.db, {
      limit: p.limit,
      offset: p.offset,
      q: p.q,
      active: p.active,
    });
    return reply.send({
      data: rows,
      meta: { total, limit: p.limit, offset: p.offset },
    });
  });

  fastify.post("/users", async (req, reply) => {
    const body = createUserBodySchema.safeParse(req.body);
    if (!body.success) {
      return reply.status(400).send({
        error: {
          code: "VALIDATION_ERROR",
          details: body.error!.flatten().fieldErrors,
        },
      });
    }
    const adminId = req.adminAuth!.sub;
    const result = await createUser(fastify.db, body.data);
    if (!result.ok) {
      if (result.code === "EMAIL_TAKEN") {
        return reply.status(409).send({
          error: {
            code: "EMAIL_TAKEN",
            message: "Bu e-posta zaten kayıtlı.",
          },
        });
      }
      return reply.status(400).send({ error: { code: "BAD_REQUEST" } });
    }

    await writeAudit(fastify.db, {
      adminId,
      action: "users.create",
      entityType: "admins",
      entityId: result.row.id,
      diff: { after: { email: result.row.email } },
      ip: getClientIp(req),
    });

    return reply.status(201).send({ data: result.row });
  });

  fastify.get("/users/:id", async (req, reply) => {
    const params = userIdParamsSchema.safeParse(req.params);
    if (!params.success) {
      return reply.status(400).send({ error: { code: "VALIDATION_ERROR" } });
    }
    const row = await getUserByIdAdmin(fastify.db, params.data.id);
    if (!row) {
      return reply.status(404).send({
        error: { code: "NOT_FOUND", message: "Kayıt bulunamadı." },
      });
    }
    return reply.send({ data: row });
  });

  fastify.patch("/users/:id", async (req, reply) => {
    const params = userIdParamsSchema.safeParse(req.params);
    const body = patchUserBodySchema.safeParse(req.body);
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
    const result = await patchUser(fastify.db, params.data.id, body.data);
    if (!result.ok) return mapPatchError(reply, result.code);

    await writeAudit(fastify.db, {
      adminId,
      action: "users.update",
      entityType: "admins",
      entityId: result.row.id,
      diff: { patch: body.data },
      ip: getClientIp(req),
    });

    return reply.send({ data: result.row });
  });

  fastify.delete("/users/:id", async (req, reply) => {
    const params = userIdParamsSchema.safeParse(req.params);
    if (!params.success) {
      return reply.status(400).send({
        error: { code: "VALIDATION_ERROR", message: "Geçersiz kimlik" },
      });
    }
    const adminId = req.adminAuth!.sub;
    const result = await deleteUser(fastify.db, params.data.id, adminId);
    if (!result.ok) {
      if (result.code === "SELF_DELETE") {
        return reply.status(409).send({
          error: {
            code: "SELF_DELETE",
            message: "Kendi hesabınızı silemezsiniz.",
          },
        });
      }
      if (result.code === "LAST_SUPER_ADMIN") {
        return reply.status(409).send({
          error: {
            code: "LAST_SUPER_ADMIN",
            message: "Son süper yönetici silinemez.",
          },
        });
      }
      return reply.status(404).send({
        error: { code: "NOT_FOUND", message: "Kayıt bulunamadı." },
      });
    }

    await writeAudit(fastify.db, {
      adminId,
      action: "users.delete",
      entityType: "admins",
      entityId: params.data.id,
      ip: getClientIp(req),
    });

    return reply.status(204).send();
  });
}
