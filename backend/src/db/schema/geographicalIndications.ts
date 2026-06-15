import {
  boolean,
  date,
  index,
  pgTable,
  smallint,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { media } from "./media.js";

export const geographicalIndications = pgTable(
  "geographical_indications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    slug: varchar("slug", { length: 255 }).notNull().unique(),
    name: varchar("name", { length: 500 }).notNull(),
    category: varchar("category", { length: 100 }).notNull(),
    type: varchar("type", { length: 100 }).notNull(),
    registrationNo: varchar("registration_no", { length: 100 }),
    registeredAt: date("registered_at"),
    district: varchar("district", { length: 100 }),
    isHighlight: boolean("is_highlight").notNull().default(false),
    story: text("story"),
    coverImage: uuid("cover_image").references(() => media.id),
    sortOrder: smallint("sort_order").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("idx_geo_ind_category")
      .on(t.category)
      .where(sql`${t.isActive} = true`),
  ],
);
