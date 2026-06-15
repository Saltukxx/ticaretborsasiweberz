import { apiRequest, type ApiEnvelope } from "./http";

export type ReportRow = {
  id: string;
  slug: string;
  name: string;
  summary: string | null;
  type: string;
  periodLabel: string | null;
  fileId: string;
  reportDate: string;
  isPublished: boolean;
  publishedAt: string | null;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export async function listReportsAdmin(params: {
  limit: number;
  offset: number;
  scope: "active" | "deleted" | "all";
  type?: string;
  q?: string;
}) {
  const sp = new URLSearchParams({
    limit: String(params.limit),
    offset: String(params.offset),
    scope: params.scope,
  });
  if (params.type) sp.set("type", params.type);
  if (params.q) sp.set("q", params.q);
  return apiRequest<{
    data: ReportRow[];
    meta: { total: number; limit: number; offset: number };
  }>(`/api/v1/admin/reports?${sp.toString()}`);
}

export async function getReportAdmin(id: string) {
  return apiRequest<ApiEnvelope<ReportRow>>(`/api/v1/admin/reports/${id}`);
}

export async function createReportAdmin(body: Record<string, unknown>) {
  return apiRequest<ApiEnvelope<ReportRow>>("/api/v1/admin/reports", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function patchReportAdmin(id: string, body: Record<string, unknown>) {
  return apiRequest<ApiEnvelope<ReportRow>>(`/api/v1/admin/reports/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function publishReportAdmin(id: string) {
  return apiRequest<ApiEnvelope<ReportRow>>(`/api/v1/admin/reports/${id}/publish`, {
    method: "POST",
  });
}

export async function unpublishReportAdmin(id: string) {
  return apiRequest<ApiEnvelope<ReportRow>>(`/api/v1/admin/reports/${id}/unpublish`, {
    method: "POST",
  });
}

export async function softDeleteReportAdmin(id: string) {
  return apiRequest<ApiEnvelope<ReportRow>>(`/api/v1/admin/reports/${id}`, {
    method: "DELETE",
  });
}

export async function hardDeleteReportAdmin(id: string) {
  return apiRequest<undefined>(`/api/v1/admin/reports/${id}/permanent`, {
    method: "DELETE",
  });
}
