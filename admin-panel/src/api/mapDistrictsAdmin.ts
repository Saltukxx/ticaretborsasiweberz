import { apiRequest, type ApiEnvelope } from "./http";

export type MapDistrictRow = {
  slug: string;
  label: string;
  productLine: string;
  dailyVolume: string;
  memberCount: number;
  registrationCount: number;
  sortOrder: number;
  isActive: boolean;
  updatedAt: string;
};

export async function listMapDistrictsAdmin() {
  return apiRequest<{ data: MapDistrictRow[] }>("/api/v1/admin/map-districts");
}

export async function getMapDistrictAdmin(slug: string) {
  return apiRequest<ApiEnvelope<MapDistrictRow>>(`/api/v1/admin/map-districts/${slug}`);
}

export async function patchMapDistrictAdmin(slug: string, body: Record<string, unknown>) {
  return apiRequest<ApiEnvelope<MapDistrictRow>>(`/api/v1/admin/map-districts/${slug}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}
