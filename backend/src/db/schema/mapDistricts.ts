import {
  boolean,
  integer,
  pgTable,
  smallint,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

export const mapDistricts = pgTable("map_districts", {
  slug: varchar("slug", { length: 50 }).primaryKey(),
  label: varchar("label", { length: 200 }).notNull(),
  productLine: varchar("product_line", { length: 300 }).notNull(),
  dailyVolume: varchar("daily_volume", { length: 50 }).notNull(),
  memberCount: integer("member_count").notNull().default(0),
  registrationCount: integer("registration_count").notNull().default(0),
  sortOrder: smallint("sort_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
