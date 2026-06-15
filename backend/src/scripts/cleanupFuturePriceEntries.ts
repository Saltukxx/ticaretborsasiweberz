/**
 * Gelecek tarihli price_entries satırlarını siler (Istanbul takvim günü).
 *
 * Run (backend/):
 *   npx tsx src/scripts/cleanupFuturePriceEntries.ts
 */
import { loadConfig } from "../config.js";
import { createDb, createPool } from "../db/connection.js";
import { invalidatePricesPublicCache } from "../lib/pricesCache.js";
import { connectRedis } from "../lib/redis.js";
import { deleteFuturePriceEntries } from "../modules/prices/cleanupFuturePriceEntries.js";

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

  const removed = await deleteFuturePriceEntries(db);
  console.log(`Removed ${removed} future-dated price row(s).`);

  await invalidatePricesPublicCache(redis, config.redisPrefix);
  await pool.end();
  redis?.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
