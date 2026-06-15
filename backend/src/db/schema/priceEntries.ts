import {
  date,
  index,
  integer,
  numeric,
  pgTable,
  time,
  timestamp,
  unique,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { commodityProducts } from "./commodityProducts.js";
import { admins } from "./admins.js";

export const priceEntries = pgTable(
  "price_entries",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    productId: uuid("product_id")
      .notNull()
      .references(() => commodityProducts.id),
    entryDate: date("entry_date").notNull(),
    avgPrice: numeric("avg_price", { precision: 12, scale: 4 }).notNull(),
    lowPrice: numeric("low_price", { precision: 12, scale: 4 }).notNull(),
    highPrice: numeric("high_price", { precision: 12, scale: 4 }).notNull(),
    changePct: numeric("change_pct", { precision: 7, scale: 4 }),
    volume: numeric("volume", { precision: 14, scale: 4 }),
    volumeUnit: varchar("volume_unit", { length: 50 }),
    transactionAmount: numeric("transaction_amount", { precision: 16, scale: 4 }),
    transactionCount: integer("transaction_count"),
    sessionTime: time("session_time"),
    createdBy: uuid("created_by")
      .notNull()
      .references(() => admins.id),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    unique("price_entries_product_id_entry_date_unique").on(
      t.productId,
      t.entryDate,
    ),
    index("idx_price_entries_product_date").on(t.productId, t.entryDate),
    index("idx_price_entries_date").on(t.entryDate),
  ],
);
