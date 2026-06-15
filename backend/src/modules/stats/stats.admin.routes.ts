import type { FastifyInstance } from "fastify";
import { getClientIp } from "../../lib/clientIp.js";
import { writeAudit } from "../../lib/audit.js";
import {
  createStat,
  deleteStat,
  getStatByIdAdmin,
  listStatsAdmin,
  normalizeStatValue,
  patchStat,
} from "./stats.admin.service.js";
import {
  createStatBodySchema,
  patchStatBodySchema,
  statsIdParamsSchema,
  statsListQuerySchema,
} from "./stats.admin.schema.js";

export async function adminStatsPlugin(fastify: FastifyInstance) {
  fastify.addHook("preHandler", fastify.requireAdminAuth);

  fastify.get("/", async (req, reply) => {
    const parsed = statsListQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return reply.status(400).send({
        error: {
          code: "VALIDATION_ERROR",
          details: parsed.error.flatten().fieldErrors,
        },
      });
    }
    const p = parsed.data;
    const { rows, total } = await listStatsAdmin(fastify.db, {
      limit: p.limit,
      offset: p.offset,
    });
    return reply.send({
      data: rows,
      meta: { total, limit: p.limit, offset: p.offset },
    });
  });

  fastify.post("/", async (req, reply) => {
    const body = createStatBodySchema.safeParse(req.body);
    if (!body.success) {
      return reply.status(400).send({
        error: {
          code: "VALIDATION_ERROR",
          details: body.error!.flatten().fieldErrors,
        },
      });
    }
    const adminId = req.adminAuth!.sub;
    const row = await createStat(fastify.db, {
      label: body.data.label,
      value: normalizeStatValue(body.data.value),
      suffix: body.data.suffix,
      note: body.data.note,
      groupKey: body.data.groupKey,
      sortOrder: body.data.sortOrder,
    });

    await writeAudit(fastify.db, {
      adminId,
      action: "stats.create",
      entityType: "stats_snapshot",
      entityId: row.id,
      diff: { after: { label: row.label } },
      ip: getClientIp(req),
    });

    return reply.status(201).send({ data: row });
  });

  fastify.get("/:id", async (req, reply) => {
    const params = statsIdParamsSchema.safeParse(req.params);
    if (!params.success) {
      return reply.status(400).send({ error: { code: "VALIDATION_ERROR" } });
    }
    const row = await getStatByIdAdmin(fastify.db, params.data.id);
    if (!row) {
      return reply.status(404).send({
        error: { code: "NOT_FOUND", message: "Kayıt bulunamadı." },
      });
    }
    return reply.send({ data: row });
  });

  fastify.patch("/:id", async (req, reply) => {
    const params = statsIdParamsSchema.safeParse(req.params);
    const body = patchStatBodySchema.safeParse(req.body);
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
    const { value, ...rest } = body.data;
    const patchPayload = {
      ...rest,
      ...(value !== undefined ? { value: normalizeStatValue(value) } : {}),
    };
    const result = await patchStat(fastify.db, params.data.id, patchPayload);
    if (!result.ok) {
      return reply.status(404).send({
        error: { code: "NOT_FOUND", message: "Kayıt bulunamadı." },
      });
    }

    await writeAudit(fastify.db, {
      adminId,
      action: "stats.update",
      entityType: "stats_snapshot",
      entityId: result.row.id,
      diff: { patch: body.data },
      ip: getClientIp(req),
    });

    return reply.send({ data: result.row });
  });

  fastify.delete("/:id", async (req, reply) => {
    const params = statsIdParamsSchema.safeParse(req.params);
    if (!params.success) {
      return reply.status(400).send({
        error: { code: "VALIDATION_ERROR", message: "Geçersiz kimlik" },
      });
    }
    const adminId = req.adminAuth!.sub;
    const removed = await deleteStat(fastify.db, params.data.id);
    if (!removed) {
      return reply.status(404).send({
        error: { code: "NOT_FOUND", message: "Kayıt bulunamadı." },
      });
    }

    await writeAudit(fastify.db, {
      adminId,
      action: "stats.delete",
      entityType: "stats_snapshot",
      entityId: removed.id,
      ip: getClientIp(req),
    });

    return reply.status(204).send();
  });
}
