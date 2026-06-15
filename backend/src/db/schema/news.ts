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
import { tsvectorCol } from "./common.js";

export const news = pgTable(
  "news",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    slug: varchar("slug", { length: 255 }).notNull().unique(),
    title: varchar("title", { length: 500 }).notNull(),
    excerpt: text("excerpt").notNull(),
    body: text("body").notNull(),
    category: varchar("category", { length: 100 }).notNull(),
    tone: varchar("tone", { length: 50 }).notNull(),
    isFeatured: boolean("is_featured").notNull().default(false),
    coverImage: uuid("cover_image").references(() => media.id),
    publishedAt: timestamp("published_at", { withTimezone: true }),
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
    searchVector: tsvectorCol("search_vector"),
  },
  (t) => [
    index("idx_news_published")
      .on(t.publishedAt)
      .where(sql`${t.deletedAt} IS NULL`),
    index("idx_news_category")
      .on(t.category)
      .where(sql`${t.deletedAt} IS NULL`),
    index("idx_news_slug").on(t.slug),
    index("idx_news_search").using("gin", t.searchVector),
  ],
);
