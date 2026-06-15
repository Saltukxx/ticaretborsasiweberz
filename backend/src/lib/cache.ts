import type { RedisClient } from "./redis.js";

/**
 * Reads JSON from Redis; returns null on miss or when Redis is unavailable.
 */
export async function cacheGet<T>(redis: RedisClient | null, key: string) {
  if (!redis) return null;
  const hit = await redis.get(key);
  if (hit == null) return null;
  try {
    return JSON.parse(hit) as T;
  } catch {
    return null;
  }
}

/** Sets JSON in Redis with TTL; no-op when Redis is null. */
export async function cacheSet<T>(
  redis: RedisClient | null,
  key: string,
  ttlSeconds: number,
  value: T,
): Promise<void> {
  if (!redis) return;
  await redis.setex(key, ttlSeconds, JSON.stringify(value));
}

/**
 * Cache-aside: returns cached value or runs loader, then stores with TTL.
 */
export async function getCached<T>(
  redis: RedisClient | null,
  key: string,
  ttlSeconds: number,
  loader: () => Promise<T>,
): Promise<T> {
  const cached = await cacheGet<T>(redis, key);
  if (cached !== null) return cached;
  const data = await loader();
  await cacheSet(redis, key, ttlSeconds, data);
  return data;
}

export async function cacheDel(
  redis: RedisClient | null,
  ...keys: string[]
): Promise<void> {
  if (!redis || keys.length === 0) return;
  await redis.del(...keys);
}
