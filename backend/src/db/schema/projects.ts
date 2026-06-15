import {
  boolean,
  date,
  jsonb,
  pgTable,
  smallint,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import type { ProjectMetric, ProjectPhase } from "../project-fields.js";
import { admins } from "./admins.js";
import { media } from "./media.js";

export const projects = pgTable("projects", {
  id: uuid("id").defaultRandom().primaryKey(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  title: varchar("title", { length: 500 }).notNull(),
  description: text("description"),
  /** Detay sayfasında gösterilen zengin metin (sanitize edilmiş HTML). */
  body: text("body"),
  /** ongoing | completed — drives public showcase layout */
  status: varchar("status", { length: 50 }).notNull().default("ongoing"),
  field: varchar("field", { length: 200 }),
  progress: smallint("progress"),
  targetLabel: varchar("target_label", { length: 100 }),
  phaseLabel: varchar("phase_label", { length: 100 }),
  phases: jsonb("phases").$type<ProjectPhase[]>().notNull().default([]),
  outputs: jsonb("outputs").$type<string[]>().notNull().default([]),
  icon: varchar("icon", { length: 20 }),
  year: varchar("year", { length: 10 }),
  impact: varchar("impact", { length: 500 }),
  result: text("result"),
  metric: jsonb("metric").$type<ProjectMetric | null>(),
  sortOrder: smallint("sort_order").notNull().default(0),
  coverImage: uuid("cover_image").references(() => media.id),
  startedAt: date("started_at"),
  completedAt: date("completed_at"),
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
});
