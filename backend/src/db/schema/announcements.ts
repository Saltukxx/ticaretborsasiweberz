import {
  boolean,
  index,
  pgTable,
  smallint,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { admins } from "./admins.js";

export const announcements = pgTable(
  "announcements",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    slug: varchar("slug", { length: 255 }).notNull().unique(),
    title: varchar("title", { length: 500 }).notNull(),
    body: text("body").notNull(),
    isTicker: boolean("is_ticker").notNull().default(false),
    priority: smallint("priority").notNull().default(0),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    createdBy: uuid("created_by")
      .notNull()
      .references(() => admins.id),
    updatedBy: uuid("updated_by").references(() => admins.id),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => [
    index("idx_announcements_active")
      .on(t.publishedAt, t.expiresAt)
      .where(sql`${t.deletedAt} IS NULL`),
  ],
);
