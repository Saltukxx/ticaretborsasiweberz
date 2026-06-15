import { apiRequest, type ApiEnvelope } from "./http";

export type GeoRow = {
  id: string;
  slug: string;
  name: string;
  category: string;
  type: string;
  registrationNo: string | null;
  registeredAt: string | null;
  district: string | null;
  isHighlight: boolean;
  story: string | null;
  coverImage: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export async function listGeoAdmin(params: {
  limit: number;
  offset: number;
  active: "all" | "true" | "false";
  category?: string;
  q?: string;
}) {
  const sp = new URLSearchParams({
    limit: String(params.limit),
    offset: String(params.offset),
    active: params.active,
  });
  if (params.category) sp.set("category", params.category);
  if (params.q) sp.set("q", params.q);
  return apiRequest<{
    data: GeoRow[];
    meta: { total: number; limit: number; offset: number };
  }>(`/api/v1/admin/geo-indications?${sp.toString()}`);
}

export async function getGeoAdmin(id: string) {
  return apiRequest<ApiEnvelope<GeoRow>>(`/api/v1/admin/geo-indications/${id}`);
}

export async function createGeoAdmin(body: Record<string, unknown>) {
  return apiRequest<ApiEnvelope<GeoRow>>("/api/v1/admin/geo-indications", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function patchGeoAdmin(id: string, body: Record<string, unknown>) {
  return apiRequest<ApiEnvelope<GeoRow>>(`/api/v1/admin/geo-indications/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function deleteGeoAdmin(id: string) {
  return apiRequest<undefined>(`/api/v1/admin/geo-indications/${id}`, {
    method: "DELETE",
  });
}
