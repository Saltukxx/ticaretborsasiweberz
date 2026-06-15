import { sql } from "drizzle-orm";
import type { Database } from "../../db/connection.js";
import { istanbulTodaySql } from "../../lib/marketDate.js";

/** Remove price rows dated after today (Istanbul). Returns deleted row count. */
export async function deleteFuturePriceEntries(db: Database): Promise<number> {
  const result = await db.execute(sql`
    DELETE FROM price_entries
    WHERE entry_date > ${istanbulTodaySql}
  `);
  const n = Number(
    (result as { rowCount?: number }).rowCount ??
      (result as { rows?: unknown[] }).rows?.length ??
      0,
  );
  return n;
}
