import {
  boolean,
  index,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const contactSubmissions = pgTable(
  "contact_submissions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    fullName: varchar("full_name", { length: 200 }).notNull(),
    organization: varchar("organization", { length: 300 }),
    email: varchar("email", { length: 320 }).notNull(),
    phone: varchar("phone", { length: 50 }),
    subject: varchar("subject", { length: 500 }).notNull(),
    message: text("message").notNull(),
    status: varchar("status", { length: 20 }).notNull().default("new"),
    ipAddress: varchar("ip_address", { length: 45 }),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("idx_contact_submissions_status_created").on(t.status, t.createdAt),
  ],
);

export const newsletterSubscribers = pgTable(
  "newsletter_subscribers",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    email: varchar("email", { length: 320 }).notNull().unique(),
    frequency: varchar("frequency", { length: 20 }).notNull().default("weekly"),
    status: varchar("status", { length: 20 }).notNull().default("active"),
    ipAddress: varchar("ip_address", { length: 45 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    unsubscribedAt: timestamp("unsubscribed_at", { withTimezone: true }),
  },
  (t) => [
    index("idx_newsletter_subscribers_status").on(t.status, t.createdAt),
  ],
);

export const legalPages = pgTable("legal_pages", {
  slug: varchar("slug", { length: 64 }).primaryKey(),
  title: varchar("title", { length: 300 }).notNull(),
  body: text("body").notNull().default(""),
  isPublished: boolean("is_published").notNull().default(false),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type ContactSubmissionStatus = "new" | "read" | "archived";
export type NewsletterFrequency = "daily" | "weekly" | "monthly";
export type NewsletterStatus = "active" | "unsubscribed";

export const LEGAL_PAGE_SLUGS = [
  "kvkk",
  "gizlilik",
  "cerez",
  "erisilebilirlik",
] as const;

export type LegalPageSlug = (typeof LEGAL_PAGE_SLUGS)[number];
