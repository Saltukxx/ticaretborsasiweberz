import type { FastifyInstance } from "fastify";
import { getMarketTickerPayload } from "./marketTicker.service.js";

export async function publicMarketTickerPlugin(fastify: FastifyInstance) {
  fastify.get("/market-ticker", async (_req, reply) => {
    const data = await getMarketTickerPayload(
      fastify.db,
      fastify.redis,
      fastify.config.redisPrefix,
      fastify.config.marketTickerFinanceUrl,
    );
    return reply.send({ data });
  });
}
