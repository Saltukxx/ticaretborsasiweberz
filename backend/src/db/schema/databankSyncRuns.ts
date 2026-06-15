import {
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const databankSyncRuns = pgTable("databank_sync_runs", {
  id: uuid("id").defaultRandom().primaryKey(),
  status: varchar("status", { length: 20 }).notNull(),
  sections: text("sections").array().notNull(),
  startedAt: timestamp("started_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  finishedAt: timestamp("finished_at", { withTimezone: true }),
  groupsProcessed: integer("groups_processed"),
  rowsUpserted: integer("rows_upserted"),
  chartsProcessed: integer("charts_processed"),
  errorMessage: text("error_message"),
  meta: jsonb("meta"),
});
