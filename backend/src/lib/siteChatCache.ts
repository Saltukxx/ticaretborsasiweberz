import type { RedisClient } from "./redis.js";
import { cacheDel } from "./cache.js";

export const SITE_CHAT_CMS_TTL_SEC = 300;

export function siteChatCmsCacheKey(prefix: string): string {
  return `${prefix}cache:site-chat:cms`;
}

export async function invalidateSiteChatCmsCache(
  redis: RedisClient | null,
  prefix: string,
): Promise<void> {
  await cacheDel(redis, siteChatCmsCacheKey(prefix));
}
