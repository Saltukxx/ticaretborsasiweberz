import {
  bigint,
  index,
  jsonb,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { inetCol } from "./common.js";
import { admins } from "./admins.js";

export const auditLog = pgTable(
  "audit_log",
  {
    id: bigint("id", { mode: "number" })
      .primaryKey()
      .generatedAlwaysAsIdentity(),
    adminId: uuid("admin_id").references(() => admins.id),
    action: varchar("action", { length: 100 }).notNull(),
    entityType: varchar("entity_type", { length: 100 }),
    entityId: uuid("entity_id"),
    diff: jsonb("diff"),
    ipAddress: inetCol("ip_address"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("idx_audit_log_admin").on(t.adminId, t.createdAt),
    index("idx_audit_log_entity").on(t.entityType, t.entityId, t.createdAt),
  ],
);
