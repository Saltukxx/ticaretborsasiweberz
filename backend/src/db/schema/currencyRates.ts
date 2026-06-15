import {
  index,
  numeric,
  pgTable,
  smallint,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { admins } from "./admins.js";

export const currencyRates = pgTable(
  "currency_rates",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    code: varchar("code", { length: 20 }).notNull(),
    label: varchar("label", { length: 100 }),
    rateValue: numeric("rate_value", { precision: 18, scale: 6 }).notNull(),
    changePct: numeric("change_pct", { precision: 7, scale: 4 }),
    direction: smallint("direction"), // 1 up, -1 down, 0 flat
    recordedAt: timestamp("recorded_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    createdBy: uuid("created_by").references(() => admins.id),
  },
  (t) => [index("idx_currency_rates_code_time").on(t.code, t.recordedAt)],
);
