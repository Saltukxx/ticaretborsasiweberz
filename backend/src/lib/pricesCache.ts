import type { RedisClient } from "./redis.js";
import { cacheDel } from "./cache.js";
import type { MappedPriceEntry } from "../modules/databankSync/types.js";

export const PRICES_CACHE_TTL_SEC = 300; // 5 minutes (plan)
export const BULLETIN_SLUGS_TTL_SEC = 60 * 60 * 24 * 14; // 14 days

export function pricesCurrentCacheKey(prefix: string): string {
  return `${prefix}cache:prices:current`;
}

export function pricesBulletinCacheKey(prefix: string): string {
  return `${prefix}cache:prices:bulletin`;
}

export function bulletinSessionSlugsCacheKey(
  prefix: string,
  sessionDate: string,
): string {
  return `${prefix}cache:bulletin:slugs:${sessionDate}`;
}

/** Reject partial tescil parses that would hide most bulletin products. */
export const PARTIAL_TESCIL_MIN_RATIO = 0.5;

export function shouldSkipBulletinSlugShrink(
  existingSize: number,
  incomingSize: number,
): boolean {
  if (existingSize <= 0) return false;
  if (incomingSize >= existingSize) return false;
  return incomingSize < existingSize * PARTIAL_TESCIL_MIN_RATIO;
}

export function pricesHistoryCacheKey(
  prefix: string,
  productSlug: string,
  period: string,
): string {
  return `${prefix}cache:prices:history:${productSlug}:${period}`;
}

export async function storeBulletinSessionSlugs(
  redis: RedisClient | null,
  prefix: string,
  tescilEntries: MappedPriceEntry[],
): Promise<void> {
  if (!redis || tescilEntries.length === 0) return;

  const byDate = new Map<string, Set<string>>();
  for (const e of tescilEntries) {
    if (!e.productSlug.endsWith("-satis")) continue;
    let slugs = byDate.get(e.entryDate);
    if (!slugs) {
      slugs = new Set<string>();
      byDate.set(e.entryDate, slugs);
    }
    slugs.add(e.productSlug);
  }

  await Promise.all(
    [...byDate.entries()].map(async ([sessionDate, slugs]) => {
      const existing = await getBulletinSessionSlugs(redis, prefix, sessionDate);
      if (
        existing &&
        shouldSkipBulletinSlugShrink(existing.size, slugs.size)
      ) {
        console.warn(
          `[prices] skipped bulletin slug shrink for ${sessionDate}: ${slugs.size} incoming vs ${existing.size} cached`,
        );
        return;
      }

      await redis.set(
        bulletinSessionSlugsCacheKey(prefix, sessionDate),
        JSON.stringify([...slugs]),
        "EX",
        BULLETIN_SLUGS_TTL_SEC,
      );
    }),
  );
}

export async function getBulletinSessionSlugs(
  redis: RedisClient | null,
  prefix: string,
  sessionDate: string,
): Promise<Set<string> | null> {
  if (!redis) return null;
  const raw = await redis.get(bulletinSessionSlugsCacheKey(prefix, sessionDate));
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return null;
    return new Set(parsed.filter((s): s is string => typeof s === "string"));
  } catch {
    return null;
  }
}

export async function invalidatePricesPublicCache(
  redis: RedisClient | null,
  keyPrefix: string,
): Promise<void> {
  await cacheDel(
    redis,
    pricesCurrentCacheKey(keyPrefix),
    pricesBulletinCacheKey(keyPrefix),
  );
}
