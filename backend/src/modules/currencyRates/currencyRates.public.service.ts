import { sql } from "drizzle-orm";
import type { Database } from "../../db/connection.js";

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

/** One latest row per `code` */
export async function fetchLatestCurrencyRates(db: Database) {
  const result = await db.execute(sql`
    SELECT DISTINCT ON (code)
      id,
      code,
      label,
      rate_value,
      change_pct,
      direction,
      recorded_at,
      created_by
    FROM currency_rates
    ORDER BY code, recorded_at DESC
  `);
  return extractRows(result).map(mapRow);
}

export type PublicCurrencyRate = {
  id: string;
  code: string;
  label: string | null;
  rateValue: number;
  changePct: number | null;
  direction: number | null;
  recordedAt: string | null;
};

function mapRow(r: Record<string, unknown>): PublicCurrencyRate {
  return {
    id: String(r.id),
    code: String(r.code),
    label: r.label != null ? String(r.label) : null,
    rateValue: num(r.rate_value)!,
    changePct: r.change_pct != null ? num(r.change_pct)! : null,
    direction:
      r.direction != null && r.direction !== ""
        ? Number(r.direction)
        : null,
    recordedAt: iso(r.recorded_at),
  };
}

function num(v: unknown): number | null {
  if (v == null) return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

function iso(v: unknown): string | null {
  if (v == null) return null;
  if (v instanceof Date) return v.toISOString();
  return String(v);
}
