import {
  boolean,
  pgTable,
  smallint,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { media } from "./media.js";
import { admins } from "./admins.js";

export const corporateProfile = pgTable("corporate_profile", {
  id: uuid("id").defaultRandom().primaryKey(),
  eyebrow: varchar("eyebrow", { length: 200 }).notNull().default(""),
  heading: varchar("heading", { length: 500 }).notNull().default(""),
  lead: text("lead").notNull().default(""),
  mission: text("mission").notNull().default(""),
  vision: text("vision").notNull().default(""),
  address: text("address"),
  phone: varchar("phone", { length: 100 }),
  fax: varchar("fax", { length: 100 }),
  emailPrimary: varchar("email_primary", { length: 320 }),
  emailSecondary: varchar("email_secondary", { length: 320 }),
  hours: text("hours"),
  socialLinkedin: varchar("social_linkedin", { length: 500 }),
  socialX: varchar("social_x", { length: 500 }),
  socialYoutube: varchar("social_youtube", { length: 500 }),
  socialInstagram: varchar("social_instagram", { length: 500 }),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const corporateMilestones = pgTable("corporate_milestones", {
  id: uuid("id").defaultRandom().primaryKey(),
  year: varchar("year", { length: 10 }).notNull(),
  title: varchar("title", { length: 300 }).notNull(),
  description: text("description").notNull(),
  sortOrder: smallint("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const CORPORATE_DOCUMENT_CATEGORIES = [
  "politika",
  "tarihce",
  "plan",
  "organizasyon",
] as const;

export type CorporateDocumentCategory =
  (typeof CORPORATE_DOCUMENT_CATEGORIES)[number];

export const corporateDocuments = pgTable("corporate_documents", {
  id: uuid("id").defaultRandom().primaryKey(),
  slug: varchar("slug", { length: 120 }).notNull().unique(),
  title: varchar("title", { length: 300 }).notNull(),
  summary: text("summary"),
  body: text("body"),
  category: varchar("category", { length: 40 }).notNull().default("politika"),
  fileId: uuid("file_id")
    .notNull()
    .references(() => media.id),
  sortOrder: smallint("sort_order").notNull().default(0),
  isPublished: boolean("is_published").notNull().default(true),
  createdBy: uuid("created_by")
    .notNull()
    .references(() => admins.id),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
