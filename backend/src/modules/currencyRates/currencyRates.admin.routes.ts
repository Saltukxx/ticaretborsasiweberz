import type { FastifyInstance } from "fastify";
import { getClientIp } from "../../lib/clientIp.js";
import { writeAudit } from "../../lib/audit.js";
import { invalidateCurrencyRatesCache } from "../../lib/currencyRatesCache.js";
import {
  createCurrencyRateSnapshot,
  deleteCurrencyRateSnapshot,
  listCurrencyRatesAdmin,
} from "./currencyRates.admin.service.js";
import {
  createCurrencyRateBodySchema,
  currencyRatesListQuerySchema,
} from "./currencyRates.admin.schema.js";

export async function adminCurrencyRatesPlugin(fastify: FastifyInstance) {
  fastify.addHook("preHandler", fastify.requireAdminAuth);

  fastify.get("/", async (req, reply) => {
    const q = currencyRatesListQuerySchema.safeParse(req.query);
    if (!q.success) {
      return reply.status(400).send({
        error: {
          code: "VALIDATION_ERROR",
          details: q.error.flatten().fieldErrors,
        },
      });
    }
    const p = q.data;
    const { rows, total } = await listCurrencyRatesAdmin(fastify.db, {
      limit: p.limit,
      offset: p.offset,
      code: p.code,
    });
    return reply.send({
      data: rows,
      meta: { total, limit: p.limit, offset: p.offset },
    });
  });

  fastify.post("/", async (req, reply) => {
    const body = createCurrencyRateBodySchema.safeParse(req.body);
    if (!body.success) {
      return reply.status(400).send({
        error: {
          code: "VALIDATION_ERROR",
          details: body.error!.flatten().fieldErrors,
        },
      });
    }
    const adminId = req.adminAuth!.sub;
    const row = await createCurrencyRateSnapshot(fastify.db, {
      code: body.data.code,
      label: body.data.label,
      rateValue: body.data.rateValue,
      changePct: body.data.changePct ?? null,
      direction: body.data.direction ?? null,
      createdBy: adminId,
    });

    await writeAudit(fastify.db, {
      adminId,
      action: "currency_rates.create",
      entityType: "currency_rates",
      entityId: row.id,
      ip: getClientIp(req),
    });
    await invalidateCurrencyRatesCache(
      fastify.redis,
      fastify.config.redisPrefix,
    );

    return reply.status(201).send({ data: row });
  });

  fastify.delete<{ Params: { id: string } }>("/:id", async (req, reply) => {
    const { id } = req.params;
    const adminId = req.adminAuth!.sub;
    const deleted = await deleteCurrencyRateSnapshot(fastify.db, id);
    if (!deleted) {
      return reply.status(404).send({
        error: { code: "NOT_FOUND", message: "Kayıt bulunamadı." },
      });
    }
    await writeAudit(fastify.db, {
      adminId,
      action: "currency_rates.delete",
      entityType: "currency_rates",
      entityId: id,
      ip: getClientIp(req),
    });
    await invalidateCurrencyRatesCache(
      fastify.redis,
      fastify.config.redisPrefix,
    );
    return reply.status(204).send();
  });
}
