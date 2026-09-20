import { and, count, desc, eq, gte, lte, sql } from "drizzle-orm";
import type { Database } from "../../db/connection.js";
import { commodityProducts, priceEntries } from "../../db/schema/index.js";

export async function listPriceEntriesAdmin(
  db: Database,
  params: {
    limit: number;
    offset: number;
    productId?: string;
    fromDate?: string;
    toDate?: string;
  },
) {
  const parts = [];
  if (params.productId) {
    parts.push(eq(priceEntries.productId, params.productId));
  }
  if (params.fromDate) {
    parts.push(gte(priceEntries.entryDate, params.fromDate));
  }
  if (params.toDate) {
    parts.push(lte(priceEntries.entryDate, params.toDate));
  }
  const whereClause = parts.length > 0 ? and(...parts) : undefined;

  const countBase = db.select({ total: count() }).from(priceEntries);
  const [countRow] = await (whereClause
    ? countBase.where(whereClause)
    : countBase);

  const rowsBase = db
    .select()
    .from(priceEntries)
    .orderBy(desc(priceEntries.entryDate), desc(priceEntries.createdAt));
  const rows = await (whereClause
    ? rowsBase.where(whereClause)
    : rowsBase
  )
    .limit(params.limit)
    .offset(params.offset);

  return {
    rows,
    total: Number(countRow?.total ?? 0),
  };
}

export async function getPriceEntryById(db: Database, id: string) {
  const [row] = await db
    .select()
    .from(priceEntries)
    .where(eq(priceEntries.id, id))
    .limit(1);
  return row ?? null;
}

export async function createPriceEntry(
  db: Database,
  adminId: string,
  input: {
    productId: string;
    entryDate: string;
    avgPrice: string;
    lowPrice: string;
    highPrice: string;
    changePct?: string | null;
    volume?: string | null;
    volumeUnit?: string | null;
    transactionAmount?: string | null;
    transactionCount?: number | null;
    sessionTime?: string | null;
  },
): Promise<
  | { ok: true; row: typeof priceEntries.$inferSelect }
  | { ok: false; code: "PRODUCT_NOT_FOUND" }
> {
  const product = await db
    .select({ id: commodityProducts.id })
    .from(commodityProducts)
    .where(eq(commodityProducts.id, input.productId))
    .limit(1);
  if (!product[0]) return { ok: false, code: "PRODUCT_NOT_FOUND" };

  const [row] = await db
    .insert(priceEntries)
    .values({
      productId: input.productId,
      entryDate: input.entryDate,
      avgPrice: input.avgPrice,
      lowPrice: input.lowPrice,
      highPrice: input.highPrice,
      changePct: input.changePct ?? null,
      volume: input.volume ?? null,
      volumeUnit: input.volumeUnit ?? null,
      transactionAmount: input.transactionAmount ?? null,
      transactionCount: input.transactionCount ?? null,
      sessionTime: input.sessionTime ?? null,
      createdBy: adminId,
    })
    .returning();

  if (!row) throw new Error("insert price entry failed");
  return { ok: true, row };
}

export async function patchPriceEntry(
  db: Database,
  id: string,
  patch: Partial<{
    avgPrice: string;
    lowPrice: string;
    highPrice: string;
    changePct: string | null;
    volume: string | null;
    volumeUnit: string | null;
    transactionAmount: string | null;
    transactionCount: number | null;
    sessionTime: string | null;
  }>,
): Promise<
  { ok: true; row: typeof priceEntries.$inferSelect } | { ok: false }
> {
  const cleaned = Object.fromEntries(
    Object.entries(patch).filter(([, v]) => v !== undefined),
  );
  if (Object.keys(cleaned).length === 0) {
    const row = await getPriceEntryById(db, id);
    return row ? { ok: true, row } : { ok: false };
  }

  const [row] = await db
    .update(priceEntries)
    .set(cleaned as Partial<typeof priceEntries.$inferInsert>)
    .where(eq(priceEntries.id, id))
    .returning();

  if (!row) return { ok: false };
  return { ok: true, row };
}

export async function deletePriceEntry(db: Database, id: string) {
  const [row] = await db
    .delete(priceEntries)
    .where(eq(priceEntries.id, id))
    .returning({ id: priceEntries.id });
  return row ?? null;
}

export type BulkPriceRow = {
  productSlug: string;
  entryDate: string;
  avgPrice: string;
  lowPrice: string;
  highPrice: string;
  changePct?: string | null;
  volume?: string | null;
  volumeUnit?: string | null;
  transactionAmount?: string | null;
  transactionCount?: number | null;
  sessionTime?: string | null;
};

export async function bulkUpsertPriceEntries(
  db: Database,
  adminId: string,
  rows: BulkPriceRow[],
): Promise<
  | { ok: true; upserted: number }
  | { ok: false; code: "UNKNOWN_SLUG"; slug: string }
> {
  const uniqueSlugs = [...new Set(rows.map((r) => r.productSlug))];
  const slugToId = new Map<string, string>();

  for (const slug of uniqueSlugs) {
    const [p] = await db
      .select({ id: commodityProducts.id })
      .from(commodityProducts)
      .where(eq(commodityProducts.slug, slug))
      .limit(1);
    if (!p) return { ok: false, code: "UNKNOWN_SLUG", slug };
    slugToId.set(slug, p.id);
  }

  let n = 0;
  await db.transaction(async (tx) => {
    for (const r of rows) {
      const productId = slugToId.get(r.productSlug)!;
      await tx
        .insert(priceEntries)
        .values({
          productId,
          entryDate: r.entryDate,
          avgPrice: r.avgPrice,
          lowPrice: r.lowPrice,
          highPrice: r.highPrice,
          changePct: r.changePct ?? null,
          volume: r.volume ?? null,
          volumeUnit: r.volumeUnit ?? null,
          transactionAmount: r.transactionAmount ?? null,
          transactionCount: r.transactionCount ?? null,
          sessionTime: r.sessionTime ?? null,
          createdBy: adminId,
        })
        .onConflictDoUpdate({
          target: [priceEntries.productId, priceEntries.entryDate],
          set: {
            avgPrice: sql`excluded.avg_price`,
            lowPrice: sql`excluded.low_price`,
            highPrice: sql`excluded.high_price`,
            changePct: sql`excluded.change_pct`,
            volume: sql`COALESCE(excluded.volume, ${priceEntries.volume})`,
            volumeUnit: sql`COALESCE(excluded.volume_unit, ${priceEntries.volumeUnit})`,
            transactionAmount: sql`COALESCE(excluded.transaction_amount, ${priceEntries.transactionAmount})`,
            transactionCount: sql`COALESCE(excluded.transaction_count, ${priceEntries.transactionCount})`,
            sessionTime: sql`COALESCE(excluded.session_time, ${priceEntries.sessionTime})`,
            createdBy: sql`excluded.created_by`,
          },
        });
      n += 1;
    }
  });

  return { ok: true, upserted: n };
}
