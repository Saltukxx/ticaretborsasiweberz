import { apiRequest, type ApiEnvelope } from "./http";

export type EventRow = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  location: string | null;
  startsAt: string;
  endsAt: string | null;
  coverImage: string | null;
  registrationOpen: boolean;
  isStakeholder: boolean;
  statusLabel: string | null;
  isPublished: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export async function listEventsAdmin(params: {
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
    data: EventRow[];
    meta: { total: number; limit: number; offset: number };
  }>(`/api/v1/admin/events?${sp.toString()}`);
}

export async function getEventAdmin(id: string) {
  return apiRequest<ApiEnvelope<EventRow>>(`/api/v1/admin/events/${id}`);
}

export async function createEventAdmin(body: Record<string, unknown>) {
  return apiRequest<ApiEnvelope<EventRow>>("/api/v1/admin/events", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function patchEventAdmin(id: string, body: Record<string, unknown>) {
  return apiRequest<ApiEnvelope<EventRow>>(`/api/v1/admin/events/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function publishEventAdmin(id: string) {
  return apiRequest<ApiEnvelope<EventRow>>(`/api/v1/admin/events/${id}/publish`, {
    method: "POST",
  });
}

export async function unpublishEventAdmin(id: string) {
  return apiRequest<ApiEnvelope<EventRow>>(`/api/v1/admin/events/${id}/unpublish`, {
    method: "POST",
  });
}

export async function softDeleteEventAdmin(id: string) {
  return apiRequest<ApiEnvelope<EventRow>>(`/api/v1/admin/events/${id}`, {
    method: "DELETE",
  });
}

export async function hardDeleteEventAdmin(id: string) {
  return apiRequest<undefined>(`/api/v1/admin/events/${id}/permanent`, {
    method: "DELETE",
  });
}
