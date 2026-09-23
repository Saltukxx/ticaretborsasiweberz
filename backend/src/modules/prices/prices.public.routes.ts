import type { FastifyInstance } from "fastify";
import { z } from "zod";
import {
  PRICES_CACHE_TTL_SEC,
  pricesBulletinCacheKey,
  pricesCurrentCacheKey,
  pricesHistoryCacheKey,
} from "../../lib/pricesCache.js";
import { getCached } from "../../lib/cache.js";
import {
  fetchBulletinPayload,
  fetchCurrentPricesRows,
  fetchPriceHistoryForSlug,
} from "./prices.public.service.js";
import { priceHistoryQuerySchema } from "./prices.admin.schema.js";
import { isValidSlug } from "../../lib/slug.js";

const slugParamsSchema = z.object({
  productSlug: z.string().min(1).max(100).refine(isValidSlug, "invalid_slug"),
});

export async function publicPricesPlugin(fastify: FastifyInstance) {
  fastify.get("/prices/current", async (_req, reply) => {
    const prefix = fastify.config.redisPrefix;
    const key = pricesCurrentCacheKey(prefix);
    const data = await getCached(
      fastify.redis,
      key,
      PRICES_CACHE_TTL_SEC,
      () => fetchCurrentPricesRows(fastify.db),
    );
    return reply.send({ data });
  });

  fastify.get("/prices/bulletin", async (_req, reply) => {
    const prefix = fastify.config.redisPrefix;
    const key = pricesBulletinCacheKey(prefix);
    const payload = await getCached(
      fastify.redis,
      key,
      PRICES_CACHE_TTL_SEC,
      () => fetchBulletinPayload(fastify.db, fastify.redis, prefix),
    );
    return reply.send({
      data: {
        sessionDate: payload.sessionDate,
        rows: payload.rows,
      },
    });
  });

  fastify.get("/prices/history/:productSlug", async (req, reply) => {
    const params = slugParamsSchema.safeParse(req.params);
    const query = priceHistoryQuerySchema.safeParse(req.query);
    if (!params.success || !query.success) {
      return reply.status(400).send({
        error: { code: "VALIDATION_ERROR", message: "Geçersiz parametreler" },
      });
    }
    const slug = params.data.productSlug;
    const periodKey = query.data.period ?? "default";
    const prefix = fastify.config.redisPrefix;
    const cacheKey = pricesHistoryCacheKey(
      prefix,
      slug,
      periodKey,
      query.data.from,
      query.data.to,
      query.data.limit,
    );
    const rows = await getCached(
      fastify.redis,
      cacheKey,
      PRICES_CACHE_TTL_SEC,
      () =>
        fetchPriceHistoryForSlug(fastify.db, slug, {
          limit: query.data.limit,
          period: query.data.period,
          from: query.data.from,
          to: query.data.to,
        }),
    );
    return reply.send({ data: rows });
  });
}
