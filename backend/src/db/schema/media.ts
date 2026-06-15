import {
  bigint,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { admins } from "./admins.js";

export const media = pgTable("media", {
  id: uuid("id").defaultRandom().primaryKey(),
  filename: varchar("filename", { length: 500 }).notNull(),
  originalName: varchar("original_name", { length: 500 }).notNull(),
  mimeType: varchar("mime_type", { length: 100 }).notNull(),
  sizeBytes: bigint("size_bytes", { mode: "number" }).notNull(),
  storageKey: text("storage_key").notNull().unique(),
  publicUrl: text("public_url").notNull(),
  width: integer("width"),
  height: integer("height"),
  altText: varchar("alt_text", { length: 500 }),
  uploadedBy: uuid("uploaded_by")
    .notNull()
    .references(() => admins.id),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
