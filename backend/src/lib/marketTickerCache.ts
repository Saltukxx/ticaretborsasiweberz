import type { RedisClient } from "./redis.js";
import { cacheDel } from "./cache.js";

export const MARKET_TICKER_CACHE_TTL_SEC = 300;

export function marketTickerCacheKey(prefix: string): string {
  return `${prefix}cache:market_ticker:latest`;
}

export async function invalidateMarketTickerCache(
  redis: RedisClient | null,
  keyPrefix: string,
): Promise<void> {
  await cacheDel(redis, marketTickerCacheKey(keyPrefix));
}
