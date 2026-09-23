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

export function pricesHistoryCacheKey(
  prefix: string,
  productSlug: string,
  period: string,
  from?: string,
  to?: string,
  limit?: number,
): string {
  const fromPart = from ?? "";
  const toPart = to ?? "";
  const limitPart = limit ?? "default";
  return `${prefix}cache:prices:history:${productSlug}:${period}:${fromPart}:${toPart}:${limitPart}`;
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
    [...byDate.entries()].map(([sessionDate, slugs]) =>
      redis.set(
        bulletinSessionSlugsCacheKey(prefix, sessionDate),
        JSON.stringify([...slugs]),
        "EX",
        BULLETIN_SLUGS_TTL_SEC,
      ),
    ),
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
