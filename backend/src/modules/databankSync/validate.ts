import { and, desc, eq, lt, lte } from "drizzle-orm";
import type { Database } from "../../db/connection.js";
import { commodityProducts, priceEntries } from "../../db/schema/index.js";
import { isoDateToday } from "./normalize.js";
import { isCorruptDisplayName } from "./encoding.js";
import type { MappedPriceEntry } from "./types.js";

/** Max ₺/kg (veya birim) — açıkça hatalı parse’ları ele */
const MAX_UNIT_PRICE = 500_000;
const PRICE_EPS = 0.02;

function asNum(v: string | null | undefined): number | null {
  if (v == null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/**
 * Kayıt yayınlanmadan önce doğrula. null = geçerli.
 */
export function validateMappedEntry(entry: MappedPriceEntry): string | null {
  if (isCorruptDisplayName(entry.productName)) {
    return "corrupt_product_name";
  }
  if (isCorruptDisplayName(entry.category)) {
    return "corrupt_category";
  }

  const low = asNum(entry.lowPrice);
  const high = asNum(entry.highPrice);
  const avg = asNum(entry.avgPrice);

  if (low == null || high == null || avg == null) {
    return "missing_price";
  }
  if (low <= 0 || high <= 0 || avg <= 0) {
    return "non_positive_price";
  }
  if (low > high + PRICE_EPS) {
    return "low_exceeds_high";
  }
  if (avg < low - PRICE_EPS || avg > high + PRICE_EPS) {
    return "avg_outside_range";
  }
  if (high > MAX_UNIT_PRICE || avg > MAX_UNIT_PRICE) {
    return "price_out_of_range";
  }

  const vol = asNum(entry.volume ?? null);
  if (vol != null && vol < 0) return "negative_volume";

  const amount = asNum(entry.transactionAmount ?? null);
  if (amount != null && amount < 0) return "negative_transaction_amount";

  if (
    entry.transactionCount != null &&
    (!Number.isInteger(entry.transactionCount) || entry.transactionCount < 0)
  ) {
    return "invalid_transaction_count";
  }

  return null;
}

export function filterValidEntries(entries: MappedPriceEntry[]): {
  valid: MappedPriceEntry[];
  rejected: { entry: MappedPriceEntry; reason: string }[];
} {
  const valid: MappedPriceEntry[] = [];
  const rejected: { entry: MappedPriceEntry; reason: string }[] = [];
  for (const entry of entries) {
    const reason = validateMappedEntry(entry);
    if (reason) rejected.push({ entry, reason });
    else valid.push(entry);
  }
  return { valid, rejected };
}

/** Önceki seans ortalamasına göre günlük değişim % (yalnızca güvenilir aralıkta). */
export async function enrichChangePctFromHistory(
  db: Database,
  entries: MappedPriceEntry[],
): Promise<void> {
  const today = isoDateToday();
  for (const entry of entries) {
    const [prev] = await db
      .select({ avgPrice: priceEntries.avgPrice })
      .from(priceEntries)
      .innerJoin(
        commodityProducts,
        eq(commodityProducts.id, priceEntries.productId),
      )
      .where(
        and(
          eq(commodityProducts.slug, entry.productSlug),
          lt(priceEntries.entryDate, entry.entryDate),
          lte(priceEntries.entryDate, today),
        ),
      )
      .orderBy(desc(priceEntries.entryDate), desc(priceEntries.createdAt))
      .limit(1);

    if (!prev?.avgPrice) continue;

    const prevAvg = Number(prev.avgPrice);
    const currAvg = Number(entry.avgPrice);
    if (prevAvg <= 0 || currAvg <= 0) continue;

    const pct = ((currAvg - prevAvg) / prevAvg) * 100;
    if (!Number.isFinite(pct) || Math.abs(pct) > 500) continue;

    entry.changePct = pct.toFixed(4);
  }
}

export type PublicPriceLike = {
  avg_price: number | null;
  low_price: number | null;
  high_price: number | null;
  product_name: string;
};

/** API yanıtından tutarsız satırları çıkar (çift savunma). */
export function isPublishablePublicRow(row: PublicPriceLike): boolean {
  if (isCorruptDisplayName(row.product_name)) return false;
  const avg = row.avg_price;
  const low = row.low_price;
  const high = row.high_price;
  if (avg == null || avg <= 0) return false;
  if (low != null && high != null && low > high + PRICE_EPS) return false;
  if (low != null && avg < low - PRICE_EPS) return false;
  if (high != null && avg > high + PRICE_EPS) return false;
  if (high != null && high > MAX_UNIT_PRICE) return false;
  return true;
}
