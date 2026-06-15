import type { RedisClient } from "./redis.js";

const NEWS_REVISION_KEY = "cache:news:revision";

/** Bump monotonic revision so cached public lists can include version in keys. */
export async function bumpNewsCacheRevision(
  redis: RedisClient | null,
  keyPrefix: string,
): Promise<void> {
  if (!redis) return;
  await redis.incr(`${keyPrefix}${NEWS_REVISION_KEY}`);
}
