import { sql, type SQL } from "drizzle-orm";
import { istanbulTodaySql } from "./marketDate.js";

/**
 * Önceki kayıtlı fiyat satırına göre değişim % (dış `pe` satırı).
 * Günlük bülten: bir önceki işlem günü / kayıt tarihi referans alınır.
 */
export const changePctFromPrevEntrySql: SQL = sql`
  (
    SELECT CASE
      WHEN prev.avg_price IS NOT NULL AND prev.avg_price::numeric > 0 THEN
        ROUND(
          (
            (pe.avg_price::numeric - prev.avg_price::numeric)
            / prev.avg_price::numeric
            * 100
          )::numeric,
          4
        )
      ELSE NULL
    END
    FROM (
      SELECT p2.avg_price
      FROM price_entries p2
      WHERE p2.product_id = pe.product_id
        AND p2.entry_date < pe.entry_date
        AND p2.entry_date <= ${istanbulTodaySql}
        AND p2.avg_price IS NOT NULL
        AND p2.avg_price::numeric > 0
      ORDER BY p2.entry_date DESC, p2.created_at DESC
      LIMIT 1
    ) prev
  )
`;
