import type { RedisClient } from "./redis.js";

const ANN_REVISION_KEY = "cache:announcements:revision";

export async function bumpAnnouncementsCacheRevision(
  redis: RedisClient | null,
  keyPrefix: string,
): Promise<void> {
  if (!redis) return;
  await redis.incr(`${keyPrefix}${ANN_REVISION_KEY}`);
}
