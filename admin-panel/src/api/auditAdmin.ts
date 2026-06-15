import { apiRequest } from "./http";

export type AuditLogRow = {
  id: string;
  adminId: string;
  adminEmail: string | null;
  adminName: string | null;
  action: string;
  entityType: string | null;
  entityId: string | null;
  diff: unknown;
  ipAddress: string | null;
  createdAt: string;
};

export async function listAuditLogAdmin(params: {
  limit: number;
  offset: number;
  q?: string;
  action?: string;
  adminId?: string;
  from?: string;
  to?: string;
}) {
  const sp = new URLSearchParams({
    limit: String(params.limit),
    offset: String(params.offset),
  });
  if (params.q) sp.set("q", params.q);
  if (params.action) sp.set("action", params.action);
  if (params.adminId) sp.set("adminId", params.adminId);
  if (params.from) sp.set("from", params.from);
  if (params.to) sp.set("to", params.to);
  return apiRequest<{
    data: AuditLogRow[];
    meta: { total: number; limit: number; offset: number };
  }>(`/api/v1/admin/audit-log?${sp.toString()}`);
}
