import cron from "node-cron";
import type { FastifyInstance } from "fastify";
import type { Config } from "../../config.js";
import type { Database } from "../../db/connection.js";
import type { RedisClient } from "../../lib/redis.js";
import { databankConfigFromApp, runDatabankSync } from "./sync.service.js";

export function startDatabankHourlyCron(
  app: FastifyInstance,
  db: Database,
  redis: RedisClient | null,
  config: Config,
): void {
  if (!config.databankSyncEnabled || !config.databankHourlySync) {
    app.log.info("DataBank hourly cron disabled");
    return;
  }

  const expr = config.databankSyncCronExpr;
  if (!cron.validate(expr)) {
    app.log.error({ expr }, "Invalid DATABANK_SYNC_CRON expression");
    return;
  }

  const cfg = databankConfigFromApp(config);

  const run = async (trigger: string) => {
    app.log.info({ trigger, expr }, "DataBank scheduled sync start");
    try {
      const result = await runDatabankSync(
        db,
        redis,
        config.redisPrefix,
        cfg,
        { sections: ["home", "tescil"] },
      );
      if (result.status === "skipped") {
        app.log.warn({ trigger }, "DataBank sync already running, skip");
        return;
      }
      if (result.status === "failed") {
        app.log.error({ result }, "DataBank scheduled sync failed");
        return;
      }
      app.log.info({ result }, "DataBank scheduled sync finished");
    } catch (err) {
      app.log.error({ err }, "DataBank scheduled sync failed");
    }
  };

  cron.schedule(expr, () => {
    void run("cron");
  });

  app.log.info({ expr }, "DataBank hourly cron scheduled");

  // First run shortly after API boot (stagger from other startup work)
  setTimeout(() => {
    void run("startup");
  }, 60_000);
}
