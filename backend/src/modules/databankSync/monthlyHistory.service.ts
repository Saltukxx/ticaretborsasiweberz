import { sql } from "drizzle-orm";
import type { Database } from "../../db/connection.js";
import { priceHistoryMonthly } from "../../db/schema/index.js";
import { createProduct, getProductBySlug } from "../prices/products.admin.service.js";
import { displayProductName } from "./normalize.js";
import type { MonthlyHistoryPoint } from "./types.js";

const DEFAULT_UNIT = "₺/kg";

export async function upsertMonthlyHistory(
  db: Database,
  points: MonthlyHistoryPoint[],
): Promise<number> {
  let n = 0;
  for (const p of points) {
    let product = await getProductBySlug(db, p.productSlug);
    if (!product) {
      const created = await createProduct(db, {
        slug: p.productSlug,
        name: displayProductName(p.productName, p.saleType),
        category: p.category,
        unit: DEFAULT_UNIT,
        isActive: true,
      });
      if (created.ok) product = created.row;
      else {
        product = await getProductBySlug(db, p.productSlug);
      }
    }
    if (!product) continue;

    await db
      .insert(priceHistoryMonthly)
      .values({
        productId: product.id,
        yearMonth: p.yearMonth,
        side: p.side,
        saleType: p.saleType,
        transactionType: p.transactionType,
        avgPrice: p.avgPrice,
        lowPrice: p.lowPrice,
        highPrice: p.highPrice,
        source: "databank_chart",
      })
      .onConflictDoUpdate({
        target: [
          priceHistoryMonthly.productId,
          priceHistoryMonthly.yearMonth,
          priceHistoryMonthly.source,
          priceHistoryMonthly.transactionType,
        ],
        set: {
          avgPrice: sql`excluded.avg_price`,
          lowPrice: sql`excluded.low_price`,
          highPrice: sql`excluded.high_price`,
          saleType: sql`excluded.sale_type`,
        },
      });
    n += 1;
  }
  return n;
}
