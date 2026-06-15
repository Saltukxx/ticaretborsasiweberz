/**
 * Run DataBank scrape sync (from backend/).
 *
 *   set DATABASE_URL=...
 *   npx tsx src/scripts/runDatabankSync.ts
 *   npx tsx src/scripts/runDatabankSync.ts --dry-run
 *   npx tsx src/scripts/runDatabankSync.ts --sections=home,tescil
 */
import { loadConfig } from "../config.js";
import { createDb, createPool } from "../db/connection.js";
import { connectRedis } from "../lib/redis.js";
import {
  databankConfigFromApp,
  runDatabankSync,
} from "../modules/databankSync/sync.service.js";
import type { SyncSection } from "../modules/databankSync/types.js";

function parseArgs(argv: string[]) {
  let dryRun = false;
  let sections: SyncSection[] | undefined;
  for (const arg of argv) {
    if (arg === "--dry-run") dryRun = true;
    if (arg.startsWith("--sections=")) {
      sections = arg
        .slice("--sections=".length)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean) as SyncSection[];
    }
  }
  return { dryRun, sections };
}

async function main() {
  const { dryRun, sections } = parseArgs(process.argv.slice(2));
  const config = loadConfig();
  const pool = createPool(config);
  const db = createDb(pool);
  let redis = null;
  if (config.redisUrl) {
    try {
      redis = await connectRedis(config.redisUrl);
    } catch {
      console.warn("Redis unavailable, continuing without cache.");
    }
  }

  const cfg = databankConfigFromApp(config);
  console.log("[databank] Starting sync", {
    sections: sections ?? cfg.sections,
    dryRun,
  });

  const result = await runDatabankSync(
    db,
    redis,
    config.redisPrefix,
    cfg,
    { dryRun, sections },
  );

  console.log(JSON.stringify(result, null, 2));
  await pool.end();
  if (redis) redis.disconnect();
  process.exit(result.status === "success" ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
