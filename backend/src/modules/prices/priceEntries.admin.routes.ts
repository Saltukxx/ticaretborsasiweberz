import type { FastifyInstance } from "fastify";
import { getClientIp } from "../../lib/clientIp.js";
import { writeAudit } from "../../lib/audit.js";
import { invalidatePricesPublicCache } from "../../lib/pricesCache.js";
import {
  bulkUpsertPriceEntries,
  createPriceEntry,
  deletePriceEntry,
  getPriceEntryById,
  listPriceEntriesAdmin,
  patchPriceEntry,
} from "./priceEntries.admin.service.js";
import {
  bulkPriceEntriesBodySchema,
  createPriceEntryBodySchema,
  patchPriceEntryBodySchema,
  priceEntriesListQuerySchema,
  priceEntryIdParamsSchema,
} from "./prices.admin.schema.js";

export async function adminPriceEntriesPlugin(fastify: FastifyInstance) {
    fastify.addHook("preHandler", fastify.requireAdminAuth);

    fastify.get("/", async (req, reply) => {
      const q = priceEntriesListQuerySchema.safeParse(req.query);
      if (!q.success) {
        return reply.status(400).send({
          error: {
            code: "VALIDATION_ERROR",
            details: q.error.flatten().fieldErrors,
          },
        });
      }
      const p = q.data;
      const { rows, total } = await listPriceEntriesAdmin(fastify.db, {
        limit: p.limit,
        offset: p.offset,
        productId: p.productId,
        fromDate: p.from,
        toDate: p.to,
      });
      return reply.send({
        data: rows,
        meta: { total, limit: p.limit, offset: p.offset },
      });
    });

    fastify.post("/", async (req, reply) => {
      const body = createPriceEntryBodySchema.safeParse(req.body);
      if (!body.success) {
        return reply.status(400).send({
          error: {
            code: "VALIDATION_ERROR",
            details: body.error!.flatten().fieldErrors,
          },
        });
      }
      const adminId = req.adminAuth!.sub;
      try {
        const result = await createPriceEntry(fastify.db, adminId, {
          productId: body.data.productId,
          entryDate: body.data.entryDate,
          avgPrice: body.data.avgPrice,
          lowPrice: body.data.lowPrice,
          highPrice: body.data.highPrice,
          changePct: body.data.changePct ?? null,
          volume: body.data.volume ?? null,
          volumeUnit: body.data.volumeUnit ?? null,
          sessionTime: body.data.sessionTime ?? null,
        });
        if (!result.ok) {
          return reply.status(400).send({
            error: {
              code: "PRODUCT_NOT_FOUND",
              message: "Ürün bulunamadı.",
            },
          });
        }

        await writeAudit(fastify.db, {
          adminId,
          action: "prices.create",
          entityType: "price_entries",
          entityId: result.row.id,
          ip: getClientIp(req),
        });
        await invalidatePricesPublicCache(
          fastify.redis,
          fastify.config.redisPrefix,
        );

        return reply.status(201).send({ data: result.row });
      } catch (e: unknown) {
        if (isUniqueViolation(e)) {
          return reply.status(409).send({
            error: {
              code: "DUPLICATE_ENTRY",
              message: "Bu ürün ve tarih için kayıt zaten var.",
            },
          });
        }
        throw e;
      }
    });

    fastify.post("/bulk", async (req, reply) => {
      const body = bulkPriceEntriesBodySchema.safeParse(req.body);
      if (!body.success) {
        return reply.status(400).send({
          error: {
            code: "VALIDATION_ERROR",
            details: body.error!.flatten().fieldErrors,
          },
        });
      }
      const adminId = req.adminAuth!.sub;
      const result = await bulkUpsertPriceEntries(
        fastify.db,
        adminId,
        body.data.rows,
      );
      if (!result.ok) {
        return reply.status(400).send({
          error: {
            code: "UNKNOWN_SLUG",
            message: `Bilinmeyen ürün slug: ${result.slug}`,
          },
        });
      }

      await writeAudit(fastify.db, {
        adminId,
        action: "prices.bulk",
        entityType: "price_entries",
        diff: { upserted: result.upserted },
        ip: getClientIp(req),
      });
      await invalidatePricesPublicCache(
        fastify.redis,
        fastify.config.redisPrefix,
      );

      return reply.status(201).send({
        data: { upserted: result.upserted },
      });
    });

    fastify.get("/:id", async (req, reply) => {
      const params = priceEntryIdParamsSchema.safeParse(req.params);
      if (!params.success) {
        return reply.status(400).send({ error: { code: "VALIDATION_ERROR" } });
      }
      const row = await getPriceEntryById(fastify.db, params.data.id);
      if (!row) {
        return reply.status(404).send({
          error: { code: "NOT_FOUND", message: "Kayıt bulunamadı." },
        });
      }
      return reply.send({ data: row });
    });

    fastify.patch("/:id", async (req, reply) => {
      const params = priceEntryIdParamsSchema.safeParse(req.params);
      const body = patchPriceEntryBodySchema.safeParse(req.body);
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
      const mapped = Object.fromEntries(
        Object.entries({
          avgPrice: body.data.avgPrice,
          lowPrice: body.data.lowPrice,
          highPrice: body.data.highPrice,
          changePct: body.data.changePct,
          volume: body.data.volume,
          volumeUnit: body.data.volumeUnit,
          sessionTime: body.data.sessionTime,
        }).filter(([, v]) => v !== undefined),
      );
      const result = await patchPriceEntry(
        fastify.db,
        params.data.id,
        mapped,
      );
      if (!result.ok) {
        return reply.status(404).send({
          error: { code: "NOT_FOUND", message: "Kayıt bulunamadı." },
        });
      }

      await writeAudit(fastify.db, {
        adminId,
        action: "prices.update",
        entityType: "price_entries",
        entityId: result.row.id,
        diff: { patch: body.data },
        ip: getClientIp(req),
      });
      await invalidatePricesPublicCache(
        fastify.redis,
        fastify.config.redisPrefix,
      );

      return reply.send({ data: result.row });
    });

    fastify.delete("/:id", async (req, reply) => {
      const params = priceEntryIdParamsSchema.safeParse(req.params);
      if (!params.success) {
        return reply.status(400).send({ error: { code: "VALIDATION_ERROR" } });
      }
      const adminId = req.adminAuth!.sub;
      const removed = await deletePriceEntry(fastify.db, params.data.id);
      if (!removed) {
        return reply.status(404).send({
          error: { code: "NOT_FOUND", message: "Kayıt bulunamadı." },
        });
      }

      await writeAudit(fastify.db, {
        adminId,
        action: "prices.delete",
        entityType: "price_entries",
        entityId: removed.id,
        ip: getClientIp(req),
      });
      await invalidatePricesPublicCache(
        fastify.redis,
        fastify.config.redisPrefix,
      );

      return reply.status(204).send();
    });
}

function isUniqueViolation(e: unknown): boolean {
  return getPgErrCode(e) === "23505";
}

function getPgErrCode(e: unknown): string | undefined {
  if (e !== null && typeof e === "object") {
    if ("code" in e && typeof (e as { code: unknown }).code === "string") {
      return (e as { code: string }).code;
    }
    if ("cause" in e) {
      return getPgErrCode((e as { cause: unknown }).cause);
    }
  }
  return undefined;
}
