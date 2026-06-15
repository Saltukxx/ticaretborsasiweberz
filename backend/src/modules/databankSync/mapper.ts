import { asc } from "drizzle-orm";
import type { Database } from "../../db/connection.js";
import { commodityProducts } from "../../db/schema/index.js";
import { isValidSlug } from "../../lib/slug.js";
import {
  createProduct,
  getProductBySlug,
  patchProduct,
} from "../prices/products.admin.service.js";
import { isCorruptDisplayName, repairUtf8Mojibake } from "./encoding.js";
import type { BulkPriceRow } from "../prices/priceEntries.admin.service.js";
import {
  buildProductSlug,
  displayProductName,
  parseDatabankDate,
} from "./normalize.js";
import type {
  HomeTableRow,
  MappedPriceEntry,
  PriceSide,
  TescilBulletinRow,
} from "./types.js";

const DEFAULT_UNIT = "₺/kg";

export function mapHomeRowToEntries(row: HomeTableRow): MappedPriceEntry[] {
  const entryDate = parseDatabankDate(row.lastTradeDate);
  if (!entryDate) return [];

  const out: MappedPriceEntry[] = [];

  const sides: { side: PriceSide; prices: typeof row.buy }[] = [
    { side: "alis", prices: row.buy },
    { side: "satis", prices: row.sell },
  ];

  for (const { side, prices } of sides) {
    if (!prices.low || !prices.high || !prices.avg) continue;
    const slug = buildProductSlug(row.productName, row.saleType, side);
    if (!isValidSlug(slug)) continue;
    out.push({
      productSlug: slug,
      productName: displayProductName(row.productName, row.saleType, side),
      category: row.category,
      unit: DEFAULT_UNIT,
      entryDate,
      lowPrice: prices.low,
      highPrice: prices.high,
      avgPrice: prices.avg,
    });
  }

  return out;
}

export function mapTescilRowToEntries(
  row: TescilBulletinRow,
  entryDate: string,
): MappedPriceEntry[] {
  const slug = buildProductSlug(row.productName, row.saleType, "satis");
  if (!isValidSlug(slug)) return [];

  return [
    {
      productSlug: slug,
      productName: displayProductName(row.productName, row.saleType, "satis"),
      category: row.category,
      unit: DEFAULT_UNIT,
      entryDate,
      lowPrice: row.low,
      highPrice: row.high,
      avgPrice: row.avg,
      volume: row.volume,
      volumeUnit: row.volumeUnit,
      transactionAmount: row.transactionAmount,
      transactionCount: row.transactionCount,
    },
  ];
}

export async function ensureProducts(
  db: Database,
  entries: MappedPriceEntry[],
): Promise<void> {
  const seen = new Set<string>();
  for (const e of entries) {
    if (seen.has(e.productSlug)) continue;
    seen.add(e.productSlug);
    const existing = await getProductBySlug(db, e.productSlug);
    if (existing) {
      if (
        existing.name !== e.productName ||
        existing.category !== e.category
      ) {
        await patchProduct(db, existing.id, {
          name: e.productName,
          category: e.category,
        });
      }
      continue;
    }
    const result = await createProduct(db, {
      slug: e.productSlug,
      name: e.productName,
      category: e.category,
      unit: e.unit,
      isActive: true,
      sortOrder: 0,
    });
    if (!result.ok && result.code !== "SLUG_TAKEN") {
      throw new Error(`product create failed: ${e.productSlug}`);
    }
  }
}

/** Hide legacy rows that still have garbled labels after repair. */
export async function deactivateCorruptProducts(
  db: Database,
): Promise<number> {
  const products = await db
    .select()
    .from(commodityProducts)
    .orderBy(asc(commodityProducts.slug));
  let hidden = 0;
  for (const p of products) {
    if (!p.isActive) continue;
    if (
      !isCorruptDisplayName(p.name) &&
      !isCorruptDisplayName(p.category)
    ) {
      continue;
    }
    await patchProduct(db, p.id, { isActive: false });
    hidden++;
  }
  return hidden;
}

/** Fix Turkish names already stored as UTF-8 mojibake. */
export async function repairProductDisplayNames(
  db: Database,
): Promise<number> {
  const products = await db
    .select()
    .from(commodityProducts)
    .orderBy(asc(commodityProducts.slug));
  let fixed = 0;
  for (const p of products) {
    const name = repairUtf8Mojibake(p.name);
    const category = repairUtf8Mojibake(p.category);
    if (name === p.name && category === p.category) continue;
    await patchProduct(db, p.id, { name, category });
    fixed++;
  }
  return fixed;
}

export function toBulkRows(entries: MappedPriceEntry[]): BulkPriceRow[] {
  return entries.map((e) => ({
    productSlug: e.productSlug,
    entryDate: e.entryDate,
    avgPrice: e.avgPrice,
    lowPrice: e.lowPrice,
    highPrice: e.highPrice,
    changePct: e.changePct ?? null,
    volume: e.volume ?? null,
    volumeUnit: e.volumeUnit ?? null,
    transactionAmount: e.transactionAmount ?? null,
    transactionCount: e.transactionCount ?? null,
    sessionTime: null,
  }));
}
