import type { FastifyInstance } from "fastify";
import type { Config } from "../../config.js";
import type { Database } from "../../db/connection.js";
import type { RedisClient } from "../../lib/redis.js";
import { getMarketTickerPayload } from "./marketTicker.service.js";

const REFRESH_MS = 5 * 60 * 1000;

export function startMarketTickerCron(
  app: FastifyInstance,
  db: Database,
  redis: RedisClient | null,
  config: Config,
): void {
  if (!config.marketTickerEnabled) {
    app.log.info("Market ticker cron disabled");
    return;
  }

  const warm = async (trigger: string) => {
    try {
      const payload = await getMarketTickerPayload(
        db,
        redis,
        config.redisPrefix,
        config.marketTickerFinanceUrl,
      );
      app.log.info(
        { trigger, source: payload.source, count: payload.items.length },
        "Market ticker refreshed",
      );
    } catch (err) {
      app.log.warn({ err, trigger }, "Market ticker refresh failed");
    }
  };

  setTimeout(() => void warm("startup"), 15_000);
  setInterval(() => void warm("interval"), REFRESH_MS);
  app.log.info("Market ticker cron scheduled (5m)");
}
