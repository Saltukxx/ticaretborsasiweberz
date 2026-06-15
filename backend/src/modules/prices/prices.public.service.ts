import { sql } from "drizzle-orm";
import type { Database } from "../../db/connection.js";
import { istanbulTodaySql } from "../../lib/marketDate.js";
import { getBulletinSessionSlugs } from "../../lib/pricesCache.js";
import type { RedisClient } from "../../lib/redis.js";
import { changePctFromPrevEntrySql } from "../../lib/priceChangeSql.js";
import { isPublishablePublicRow } from "../databankSync/validate.js";

function extractRows(result: unknown): Record<string, unknown>[] {
  if (
    result &&
    typeof result === "object" &&
    "rows" in result &&
    Array.isArray((result as { rows: unknown }).rows)
  ) {
    return (result as { rows: Record<string, unknown>[] }).rows;
  }
  if (Array.isArray(result)) {
    return result as Record<string, unknown>[];
  }
  return [];
}

/**
 * Active products that have a latest price row with a positive average.
 */
export async function fetchCurrentPricesRows(db: Database) {
  const result = await db.execute(sql`
    SELECT
      pe.id            AS entry_id,
      cp.id            AS product_id,
      pe.entry_date    AS entry_date,
      pe.avg_price     AS avg_price,
      pe.low_price     AS low_price,
      pe.high_price    AS high_price,
      ${changePctFromPrevEntrySql} AS change_pct,
      pe.volume        AS volume,
      pe.volume_unit   AS volume_unit,
      pe.transaction_amount AS transaction_amount,
      pe.transaction_count AS transaction_count,
      pe.session_time  AS session_time,
      cp.slug          AS product_slug,
      cp.name          AS product_name,
      cp.category      AS product_category,
      cp.unit          AS product_unit,
      cp.sort_order    AS sort_order,
      (
        SELECT array_agg(sp.avg_price ORDER BY sp.entry_date ASC, sp.created_at ASC)
        FROM (
          SELECT avg_price, entry_date, created_at
          FROM price_entries
          WHERE product_id = cp.id
            AND entry_date <= ${istanbulTodaySql}
            AND avg_price IS NOT NULL
            AND avg_price > 0
          ORDER BY entry_date DESC, created_at DESC
          LIMIT 10
        ) sp
      )                AS sparkline_series
    FROM commodity_products cp
    INNER JOIN LATERAL (
      SELECT *
      FROM price_entries
      WHERE product_id = cp.id
        AND entry_date <= ${istanbulTodaySql}
        AND avg_price IS NOT NULL
        AND avg_price > 0
      ORDER BY entry_date DESC, created_at DESC
      LIMIT 1
    ) pe ON true
    WHERE cp.is_active = true
    ORDER BY cp.sort_order ASC, cp.name ASC
  `);
  return mapCurrentRows(extractRows(result)).filter(isPublishablePublicRow);
}

/**
 * Active products with a price row on the latest global session date.
 */
export async function fetchBulletinPayload(
  db: Database,
  redis: RedisClient | null = null,
  redisPrefix = "",
) {
  const result = await db.execute(sql`
    WITH sess AS (
      SELECT MAX(entry_date)::date AS d
      FROM price_entries
      WHERE entry_date <= ${istanbulTodaySql}
    )
    SELECT
      cp.id           AS product_id,
      cp.slug         AS product_slug,
      cp.name         AS product_name,
      cp.category     AS product_category,
      cp.unit         AS product_unit,
      cp.sort_order   AS sort_order,
      sess.d          AS session_date,
      pe.id           AS entry_id,
      pe.entry_date   AS entry_date,
      pe.avg_price    AS avg_price,
      pe.low_price    AS low_price,
      pe.high_price   AS high_price,
      ${changePctFromPrevEntrySql} AS change_pct,
      pe.volume       AS volume,
      pe.volume_unit  AS volume_unit,
      pe.transaction_amount AS transaction_amount,
      pe.transaction_count AS transaction_count,
      pe.session_time AS session_time,
      (
        SELECT array_agg(sp.avg_price ORDER BY sp.entry_date ASC, sp.created_at ASC)
        FROM (
          SELECT avg_price, entry_date, created_at
          FROM price_entries
          WHERE product_id = cp.id
            AND entry_date <= ${istanbulTodaySql}
            AND avg_price IS NOT NULL
            AND avg_price > 0
          ORDER BY entry_date DESC, created_at DESC
          LIMIT 10
        ) sp
      )                AS sparkline_series
    FROM commodity_products cp
    CROSS JOIN sess
    INNER JOIN price_entries pe
      ON pe.product_id = cp.id
     AND pe.entry_date = sess.d
     AND pe.avg_price IS NOT NULL
     AND pe.avg_price > 0
    WHERE cp.is_active = true
    ORDER BY cp.sort_order ASC, cp.name ASC
  `);
  const raw = extractRows(result);
  let rows = mapBulletinRows(raw).filter(isPublishablePublicRow);
  const sessionDate =
    rows.find((r) => r.session_date != null)?.session_date ??
    (raw[0]?.session_date != null ? toIsoDate(raw[0].session_date) : null);

  if (sessionDate) {
    const tescilSlugs = await getBulletinSessionSlugs(
      redis,
      redisPrefix,
      sessionDate,
    );
    if (tescilSlugs && tescilSlugs.size > 0) {
      rows = rows.filter((r) => tescilSlugs.has(r.product_slug));
    }
  }

  return { sessionDate, rows };
}

export type PriceHistoryQuery = {
  limit?: number;
  period?: "7d" | "30d" | "90d" | "365d";
  from?: string;
  to?: string;
};

const PERIOD_DAYS: Record<NonNullable<PriceHistoryQuery["period"]>, number> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
  "365d": 365,
};

export async function fetchPriceHistoryForSlug(
  db: Database,
  productSlug: string,
  query: PriceHistoryQuery,
) {
  const periodDays = query.period ? PERIOD_DAYS[query.period] : null;
  const limit =
    query.limit ??
    (periodDays != null ? Math.min(periodDays + 5, 400) : 30);

  const result = await db.execute(sql`
    SELECT
      pe.id,
      pe.entry_date,
      pe.avg_price,
      pe.low_price,
      pe.high_price,
      ${changePctFromPrevEntrySql} AS change_pct,
      pe.volume,
      pe.volume_unit,
      pe.session_time
    FROM price_entries pe
    INNER JOIN commodity_products cp ON cp.id = pe.product_id
    WHERE cp.slug = ${productSlug}
      AND cp.is_active = true
      AND pe.entry_date <= ${istanbulTodaySql}
      AND (${query.from ?? null}::date IS NULL OR pe.entry_date >= ${query.from ?? null}::date)
      AND (${query.to ?? null}::date IS NULL OR pe.entry_date <= ${query.to ?? null}::date)
      AND (
        ${periodDays}::int IS NULL
        OR pe.entry_date >= (${istanbulTodaySql} - (${periodDays}::int - 1))
      )
    ORDER BY pe.entry_date DESC, pe.created_at DESC
    LIMIT ${limit}
  `);
  const mapped = extractRows(result).map((r) => ({
    id: String(r.id),
    entry_date: toIsoDate(r.entry_date),
    avg_price: numOrNull(r.avg_price),
    low_price: numOrNull(r.low_price),
    high_price: numOrNull(r.high_price),
    change_pct: r.change_pct != null ? numOrNull(r.change_pct) : null,
    volume: r.volume != null ? numOrNull(r.volume) : null,
    volume_unit: r.volume_unit != null ? String(r.volume_unit) : null,
    session_time: r.session_time != null ? String(r.session_time) : null,
  }));
  return mapped.reverse();
}

export type CurrentPriceRow = {
  entry_id: string | null;
  product_id: string;
  entry_date: string | null;
  avg_price: number | null;
  low_price: number | null;
  high_price: number | null;
  change_pct: number | null;
  volume: number | null;
  volume_unit: string | null;
  transaction_amount: number | null;
  transaction_count: number | null;
  session_time: string | null;
  product_slug: string;
  product_name: string;
  product_category: string;
  product_unit: string;
  sort_order: number;
  sparkline_series: number[] | null;
};

export type BulletinRow = CurrentPriceRow & {
  session_date: string | null;
};

function mapCurrentRows(rows: Record<string, unknown>[]): CurrentPriceRow[] {
  return rows.map((r) => ({
    entry_id: r.entry_id != null ? String(r.entry_id) : null,
    product_id: String(r.product_id),
    entry_date: r.entry_date != null ? toIsoDate(r.entry_date) : null,
    avg_price: numOrNull(r.avg_price),
    low_price: numOrNull(r.low_price),
    high_price: numOrNull(r.high_price),
    change_pct: r.change_pct != null ? numOrNull(r.change_pct) : null,
    volume: r.volume != null ? numOrNull(r.volume) : null,
    volume_unit: r.volume_unit != null ? String(r.volume_unit) : null,
    transaction_amount:
      r.transaction_amount != null ? numOrNull(r.transaction_amount) : null,
    transaction_count:
      r.transaction_count != null ? intOrNull(r.transaction_count) : null,
    session_time: r.session_time != null ? String(r.session_time) : null,
    product_slug: String(r.product_slug ?? ""),
    product_name: String(r.product_name ?? ""),
    product_category: String(r.product_category ?? ""),
    product_unit: String(r.product_unit ?? ""),
    sort_order: Number(r.sort_order ?? 0),
    sparkline_series: Array.isArray(r.sparkline_series)
      ? (r.sparkline_series as unknown[]).map(Number).filter(Number.isFinite)
      : null,
  }));
}

function mapBulletinRows(rows: Record<string, unknown>[]): BulletinRow[] {
  return rows.map((r) => {
    const base = mapCurrentRows([r])[0]!;
    return {
      ...base,
      session_date:
        r.session_date != null ? toIsoDate(r.session_date) : null,
    };
  });
}

function numOrNull(v: unknown): number | null {
  if (v == null) return null;
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function intOrNull(v: unknown): number | null {
  const n = numOrNull(v);
  if (n == null) return null;
  return Number.isInteger(n) ? n : Math.trunc(n);
}

function toIsoDate(v: unknown): string | null {
  if (v == null) return null;
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  const s = String(v);
  return s.length >= 10 ? s.slice(0, 10) : s;
}
