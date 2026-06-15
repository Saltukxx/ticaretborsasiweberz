import { apiRequest, type ApiEnvelope } from "./http";

export type NewsRow = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  category: string;
  tone: string;
  isFeatured: boolean;
  coverImage: string | null;
  publishedAt: string | null;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export async function listNewsAdmin(params: {
  limit: number;
  offset: number;
  scope: "active" | "deleted" | "all";
  q?: string;
}) {
  const sp = new URLSearchParams({
    limit: String(params.limit),
    offset: String(params.offset),
    scope: params.scope,
  });
  if (params.q) sp.set("q", params.q);
  return apiRequest<{
    data: NewsRow[];
    meta: { total: number; limit: number; offset: number };
  }>(`/api/v1/admin/news?${sp.toString()}`);
}

export async function getNewsAdmin(id: string) {
  return apiRequest<ApiEnvelope<NewsRow>>(`/api/v1/admin/news/${id}`);
}

export async function createNewsAdmin(body: Record<string, unknown>) {
  return apiRequest<ApiEnvelope<NewsRow>>("/api/v1/admin/news", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function patchNewsAdmin(id: string, body: Record<string, unknown>) {
  return apiRequest<ApiEnvelope<NewsRow>>(`/api/v1/admin/news/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function publishNewsAdmin(id: string) {
  return apiRequest<ApiEnvelope<NewsRow>>(`/api/v1/admin/news/${id}/publish`, {
    method: "POST",
  });
}

export async function unpublishNewsAdmin(id: string) {
  return apiRequest<ApiEnvelope<NewsRow>>(`/api/v1/admin/news/${id}/unpublish`, {
    method: "POST",
  });
}

export async function softDeleteNewsAdmin(id: string) {
  return apiRequest<ApiEnvelope<NewsRow>>(`/api/v1/admin/news/${id}`, {
    method: "DELETE",
  });
}

export async function hardDeleteNewsAdmin(id: string) {
  return apiRequest<undefined>(`/api/v1/admin/news/${id}/permanent`, {
    method: "DELETE",
  });
}
