import type { Database } from "../db/connection.js";
import { auditLog } from "../db/schema/index.js";

export type AuditInput = {
  /** null = anonim/halka açık kaynaklı kayıt (ör. tarif sohbeti analitiği) */
  adminId: string | null;
  action: string;
  entityType?: string;
  entityId?: string;
  diff?: Record<string, unknown>;
  ip?: string | null;
};

export async function writeAudit(db: Database, input: AuditInput): Promise<void> {
  await db.insert(auditLog).values({
    adminId: input.adminId,
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId,
    diff: input.diff,
    ipAddress: input.ip ?? null,
  });
}
