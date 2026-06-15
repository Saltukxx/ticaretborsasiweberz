import { apiRequest, type ApiEnvelope } from "./http";

export type AnnouncementRow = {
  id: string;
  slug: string;
  title: string;
  body: string;
  isTicker: boolean;
  priority: number;
  expiresAt: string | null;
  publishedAt: string | null;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export async function listAnnouncementsAdmin(params: {
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
    data: AnnouncementRow[];
    meta: { total: number; limit: number; offset: number };
  }>(`/api/v1/admin/announcements?${sp.toString()}`);
}

export async function getAnnouncementAdmin(id: string) {
  return apiRequest<ApiEnvelope<AnnouncementRow>>(`/api/v1/admin/announcements/${id}`);
}

export async function createAnnouncementAdmin(body: Record<string, unknown>) {
  return apiRequest<ApiEnvelope<AnnouncementRow>>("/api/v1/admin/announcements", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function patchAnnouncementAdmin(id: string, body: Record<string, unknown>) {
  return apiRequest<ApiEnvelope<AnnouncementRow>>(`/api/v1/admin/announcements/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function publishAnnouncementAdmin(id: string) {
  return apiRequest<ApiEnvelope<AnnouncementRow>>(
    `/api/v1/admin/announcements/${id}/publish`,
    { method: "POST" },
  );
}

export async function unpublishAnnouncementAdmin(id: string) {
  return apiRequest<ApiEnvelope<AnnouncementRow>>(
    `/api/v1/admin/announcements/${id}/unpublish`,
    { method: "POST" },
  );
}

export async function softDeleteAnnouncementAdmin(id: string) {
  return apiRequest<ApiEnvelope<AnnouncementRow>>(`/api/v1/admin/announcements/${id}`, {
    method: "DELETE",
  });
}

export async function hardDeleteAnnouncementAdmin(id: string) {
  return apiRequest<undefined>(`/api/v1/admin/announcements/${id}/permanent`, {
    method: "DELETE",
  });
}
