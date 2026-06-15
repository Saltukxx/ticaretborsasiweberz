import { apiRequest, type ApiEnvelope } from "./http";

export type ServiceRow = {
  id: string;
  slug: string;
  title: string;
  description: string;
  icon: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export async function listServicesAdmin(params: {
  limit: number;
  offset: number;
  active: "all" | "true" | "false";
  q?: string;
}) {
  const sp = new URLSearchParams({
    limit: String(params.limit),
    offset: String(params.offset),
    active: params.active,
  });
  if (params.q) sp.set("q", params.q);
  return apiRequest<{
    data: ServiceRow[];
    meta: { total: number; limit: number; offset: number };
  }>(`/api/v1/admin/services?${sp.toString()}`);
}

export async function getServiceAdmin(id: string) {
  return apiRequest<ApiEnvelope<ServiceRow>>(`/api/v1/admin/services/${id}`);
}

export async function createServiceAdmin(body: Record<string, unknown>) {
  return apiRequest<ApiEnvelope<ServiceRow>>("/api/v1/admin/services", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function patchServiceAdmin(id: string, body: Record<string, unknown>) {
  return apiRequest<ApiEnvelope<ServiceRow>>(`/api/v1/admin/services/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function deleteServiceAdmin(id: string) {
  return apiRequest<undefined>(`/api/v1/admin/services/${id}`, { method: "DELETE" });
}
