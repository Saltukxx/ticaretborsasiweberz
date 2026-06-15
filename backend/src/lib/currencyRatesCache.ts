import type { RedisClient } from "./redis.js";
import { cacheDel } from "./cache.js";

export const CURRENCY_CACHE_TTL_SEC = 300;

export function currencyRatesCacheKey(prefix: string): string {
  return `${prefix}cache:currency_rates:latest`;
}

export async function invalidateCurrencyRatesCache(
  redis: RedisClient | null,
  keyPrefix: string,
): Promise<void> {
  await cacheDel(redis, currencyRatesCacheKey(keyPrefix));
}
