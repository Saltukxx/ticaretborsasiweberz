import {
  numeric,
  pgTable,
  smallint,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const statsSnapshot = pgTable("stats_snapshot", {
  id: uuid("id").defaultRandom().primaryKey(),
  label: varchar("label", { length: 255 }).notNull(),
  value: numeric("value", { precision: 18, scale: 4 }).notNull(),
  suffix: varchar("suffix", { length: 50 }),
  note: varchar("note", { length: 255 }),
  groupKey: varchar("group_key", { length: 50 }),
  sortOrder: smallint("sort_order").notNull().default(0),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
