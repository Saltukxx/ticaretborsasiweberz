import { apiRequest, type ApiEnvelope } from "./http";

export type StatRow = {
  id: string;
  label: string;
  value: string;
  suffix: string | null;
  note: string | null;
  groupKey: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export async function listStatsAdmin(params: { limit: number; offset: number }) {
  const sp = new URLSearchParams({
    limit: String(params.limit),
    offset: String(params.offset),
  });
  return apiRequest<{
    data: StatRow[];
    meta: { total: number; limit: number; offset: number };
  }>(`/api/v1/admin/stats?${sp.toString()}`);
}

export async function getStatAdmin(id: string) {
  return apiRequest<ApiEnvelope<StatRow>>(`/api/v1/admin/stats/${id}`);
}

export async function createStatAdmin(body: Record<string, unknown>) {
  return apiRequest<ApiEnvelope<StatRow>>("/api/v1/admin/stats", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function patchStatAdmin(id: string, body: Record<string, unknown>) {
  return apiRequest<ApiEnvelope<StatRow>>(`/api/v1/admin/stats/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function deleteStatAdmin(id: string) {
  return apiRequest<undefined>(`/api/v1/admin/stats/${id}`, { method: "DELETE" });
}
