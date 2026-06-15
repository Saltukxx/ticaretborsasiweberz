import { getAccessToken, setAccessToken } from "../auth/token";
import { apiRequest, type ApiEnvelope, tryRestoreSession } from "./http";

export type AdminMe = {
  id: string;
  email: string;
  name: string;
  role: "super_admin" | "editor";
};

export async function loginRequest(
  email: string,
  password: string,
): Promise<{ accessToken: string; admin: { id: string; email: string; name: string; role: AdminMe["role"] } }> {
  const json = await apiRequest<
    ApiEnvelope<{
      accessToken: string;
      admin: { id: string; email: string; name: string; role: AdminMe["role"] };
    }>
  >("/api/v1/admin/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  setAccessToken(json.data.accessToken);
  return json.data;
}

export async function logoutRequest(): Promise<void> {
  try {
    await apiRequest<undefined>("/api/v1/admin/auth/logout", { method: "POST" });
  } finally {
    setAccessToken(null);
  }
}

export async function meRequest(): Promise<AdminMe> {
  const json = await apiRequest<
    ApiEnvelope<{ id: string; email: string; name: string; role: AdminMe["role"] }>
  >("/api/v1/admin/auth/me");
  return json.data;
}

export async function changePasswordRequest(
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  await apiRequest("/api/v1/admin/auth/me/password", {
    method: "PATCH",
    body: JSON.stringify({ currentPassword, newPassword }),
  });
}

export { tryRestoreSession, getAccessToken };
