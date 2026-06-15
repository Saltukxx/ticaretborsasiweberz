import { apiRequest, type ApiEnvelope } from "./http";

export type AdminUserRow = {
  id: string;
  email: string;
  name: string;
  role: "super_admin" | "editor";
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export async function listUsersAdmin(params: {
  limit: number;
  offset: number;
  q?: string;
  active: "all" | "true" | "false";
}) {
  const sp = new URLSearchParams({
    limit: String(params.limit),
    offset: String(params.offset),
    active: params.active,
  });
  if (params.q) sp.set("q", params.q);
  return apiRequest<{
    data: AdminUserRow[];
    meta: { total: number; limit: number; offset: number };
  }>(`/api/v1/admin/users?${sp.toString()}`);
}

export async function getUserAdmin(id: string) {
  return apiRequest<ApiEnvelope<AdminUserRow>>(`/api/v1/admin/users/${id}`);
}

export async function createUserAdmin(body: Record<string, unknown>) {
  return apiRequest<ApiEnvelope<AdminUserRow>>("/api/v1/admin/users", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function patchUserAdmin(id: string, body: Record<string, unknown>) {
  return apiRequest<ApiEnvelope<AdminUserRow>>(`/api/v1/admin/users/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function deleteUserAdmin(id: string) {
  return apiRequest<undefined>(`/api/v1/admin/users/${id}`, { method: "DELETE" });
}
