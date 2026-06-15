import {
  boolean,
  date,
  index,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { admins } from "./admins.js";
import { media } from "./media.js";

export const reports = pgTable(
  "reports",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    slug: varchar("slug", { length: 255 }).notNull().unique(),
    name: varchar("name", { length: 500 }).notNull(),
    summary: text("summary"),
    type: varchar("type", { length: 50 }).notNull(),
    periodLabel: varchar("period_label", { length: 100 }),
    fileId: uuid("file_id")
      .notNull()
      .references(() => media.id),
    reportDate: date("report_date").notNull(),
    isPublished: boolean("is_published").notNull().default(false),
    createdBy: uuid("created_by")
      .notNull()
      .references(() => admins.id),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => [
    index("idx_reports_date")
      .on(t.reportDate)
      .where(sql`${t.deletedAt} IS NULL`),
    index("idx_reports_type")
      .on(t.type)
      .where(sql`${t.deletedAt} IS NULL`),
  ],
);
