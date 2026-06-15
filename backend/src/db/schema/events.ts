import {
  boolean,
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

export const events = pgTable(
  "events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    slug: varchar("slug", { length: 255 }).notNull().unique(),
    title: varchar("title", { length: 500 }).notNull(),
    description: text("description"),
    location: varchar("location", { length: 500 }),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }),
    coverImage: uuid("cover_image").references(() => media.id),
    isPublished: boolean("is_published").notNull().default(false),
    registrationOpen: boolean("registration_open").notNull().default(false),
    isStakeholder: boolean("is_stakeholder").notNull().default(false),
    statusLabel: varchar("status_label", { length: 100 }),
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
    index("idx_events_starts_at")
      .on(t.startsAt)
      .where(sql`${t.deletedAt} IS NULL`),
  ],
);
