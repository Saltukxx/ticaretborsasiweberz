import { index, jsonb, pgTable, unique, uuid, varchar } from "drizzle-orm/pg-core";

export const marketVolumeMonthly = pgTable(
  "market_volume_monthly",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    year: varchar("year", { length: 4 }).notNull(),
    chartKey: varchar("chart_key", { length: 120 }).notNull(),
    seriesName: varchar("series_name", { length: 120 }).notNull(),
    payload: jsonb("payload").notNull(),
    source: varchar("source", { length: 32 }).notNull().default("databank_volume"),
  },
  (t) => [
    unique("market_volume_monthly_key").on(
      t.year,
      t.chartKey,
      t.seriesName,
      t.source,
    ),
    index("idx_market_volume_monthly_year").on(t.year),
  ],
);
