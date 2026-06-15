import type { FastifyInstance } from "fastify";
import {
  CURRENCY_CACHE_TTL_SEC,
  currencyRatesCacheKey,
} from "../../lib/currencyRatesCache.js";
import { getCached } from "../../lib/cache.js";
import { fetchLatestCurrencyRates } from "./currencyRates.public.service.js";

export async function publicCurrencyRatesPlugin(fastify: FastifyInstance) {
  fastify.get("/currency-rates", async (_req, reply) => {
    const prefix = fastify.config.redisPrefix;
    const key = currencyRatesCacheKey(prefix);
    const data = await getCached(
      fastify.redis,
      key,
      CURRENCY_CACHE_TTL_SEC,
      () => fetchLatestCurrencyRates(fastify.db),
    );
    return reply.send({ data });
  });
}
