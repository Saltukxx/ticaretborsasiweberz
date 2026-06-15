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

/** Kurumsal yapı grupları: yönetim kurulu, meclis, TOBB delegeleri, personel, danışman */
export const LEADERSHIP_GROUP_KEYS = [
  "yonetim_kurulu",
  "meclis",
  "tobb_delegeleri",
  "personel",
  "danisman",
] as const;

export type LeadershipGroupKey = (typeof LEADERSHIP_GROUP_KEYS)[number];

export const leadership = pgTable("leadership", {
  id: uuid("id").defaultRandom().primaryKey(),
  roleKey: varchar("role_key", { length: 100 }).notNull().unique(),
  groupKey: varchar("group_key", { length: 50 })
    .notNull()
    .default("yonetim_kurulu"),
  name: varchar("name", { length: 255 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  messageTitle: varchar("message_title", { length: 255 }),
  eyebrow: varchar("eyebrow", { length: 255 }),
  quoteLines: text("quote_lines").array(),
  portraitId: uuid("portrait_id").references(() => media.id),
  sortOrder: smallint("sort_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
