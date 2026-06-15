import { apiRequest, type ApiEnvelope } from "./http";

export type PresidentLeadership = {
  id: string;
  roleKey: string;
  name: string;
  title: string;
  messageTitle: string | null;
  eyebrow: string | null;
  quoteLines: string[] | null;
  portraitId: string | null;
  portraitUrl: string | null;
  sortOrder: number;
  isActive: boolean;
  updatedAt: string;
};

export async function getPresidentAdmin() {
  return apiRequest<ApiEnvelope<PresidentLeadership>>("/api/v1/admin/leadership/president");
}

export async function patchPresidentAdmin(body: Record<string, unknown>) {
  return apiRequest<ApiEnvelope<PresidentLeadership>>("/api/v1/admin/leadership/president", {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}
