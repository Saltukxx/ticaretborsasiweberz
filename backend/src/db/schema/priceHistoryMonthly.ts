import {
  index,
  numeric,
  pgTable,
  unique,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { commodityProducts } from "./commodityProducts.js";

export const priceHistoryMonthly = pgTable(
  "price_history_monthly",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    productId: uuid("product_id")
      .notNull()
      .references(() => commodityProducts.id),
    yearMonth: varchar("year_month", { length: 7 }).notNull(),
    side: varchar("side", { length: 10 }),
    saleType: varchar("sale_type", { length: 50 }),
    transactionType: varchar("transaction_type", { length: 20 }),
    avgPrice: numeric("avg_price", { precision: 12, scale: 4 }),
    lowPrice: numeric("low_price", { precision: 12, scale: 4 }),
    highPrice: numeric("high_price", { precision: 12, scale: 4 }),
    source: varchar("source", { length: 32 }).notNull().default("databank_chart"),
  },
  (t) => [
    unique("price_history_monthly_product_month_source").on(
      t.productId,
      t.yearMonth,
      t.source,
      t.transactionType,
    ),
    index("idx_price_history_monthly_product").on(t.productId, t.yearMonth),
  ],
);
