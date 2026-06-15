/**
 * Repair Turkish product labels and hide corrupt legacy rows.
 * Usage: npm run repair:product-names
 */
import { loadConfig } from "../config.js";
import { createDb, createPool } from "../db/connection.js";
import { invalidatePricesPublicCache } from "../lib/pricesCache.js";
import { connectRedis } from "../lib/redis.js";
import {
  deactivateCorruptProducts,
  repairProductDisplayNames,
} from "../modules/databankSync/mapper.js";

async function main() {
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

  const repaired = await repairProductDisplayNames(db);
  const hidden = await deactivateCorruptProducts(db);
  if (redis) {
    await invalidatePricesPublicCache(redis, config.redisPrefix);
  }

  console.log(JSON.stringify({ repaired, hidden }, null, 2));
  await pool.end();
  if (redis) redis.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
