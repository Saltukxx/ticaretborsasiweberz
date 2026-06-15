import { jsonb, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

export type HeroKpiRow = {
  label: string;
  value: string;
  valueSuffix?: string;
  highlighted?: boolean;
};

export const heroContent = pgTable("hero_content", {
  id: uuid("id").defaultRandom().primaryKey(),
  eyebrow: varchar("eyebrow", { length: 200 }).notNull().default(""),
  titleLead: varchar("title_lead", { length: 200 }).notNull().default(""),
  titleEmphasis: varchar("title_emphasis", { length: 100 }).notNull().default(""),
  titleSuffix: varchar("title_suffix", { length: 100 }).notNull().default(""),
  titleTagline: varchar("title_tagline", { length: 200 }).notNull().default(""),
  description: text("description").notNull().default(""),
  ctaPrimaryLabel: varchar("cta_primary_label", { length: 120 }).notNull().default(""),
  ctaPrimaryHref: varchar("cta_primary_href", { length: 300 }).notNull().default(""),
  ctaSecondaryLabel: varchar("cta_secondary_label", { length: 120 }).notNull().default(""),
  ctaSecondaryHref: varchar("cta_secondary_href", { length: 300 }).notNull().default(""),
  ctaLinkLabel: varchar("cta_link_label", { length: 120 }).notNull().default(""),
  ctaLinkHref: varchar("cta_link_href", { length: 300 }).notNull().default(""),
  kpis: jsonb("kpis").$type<HeroKpiRow[]>().notNull().default([]),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
