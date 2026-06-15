import { apiRequest, type ApiEnvelope } from "./http";

export type CorporateProfile = {
  id: string;
  eyebrow: string;
  heading: string;
  lead: string;
  mission: string;
  vision: string;
  updatedAt: string;
};

export type CorporateMilestone = {
  id: string;
  year: string;
  title: string;
  description: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export async function getCorporateProfileAdmin() {
  return apiRequest<ApiEnvelope<CorporateProfile>>("/api/v1/admin/corporate/profile");
}

export async function patchCorporateProfileAdmin(body: Record<string, unknown>) {
  return apiRequest<ApiEnvelope<CorporateProfile>>("/api/v1/admin/corporate/profile", {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function listCorporateMilestonesAdmin() {
  return apiRequest<{ data: CorporateMilestone[] }>("/api/v1/admin/corporate/milestones");
}

export async function createMilestoneAdmin(body: Record<string, unknown>) {
  return apiRequest<ApiEnvelope<CorporateMilestone>>("/api/v1/admin/corporate/milestones", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function patchMilestoneAdmin(id: string, body: Record<string, unknown>) {
  return apiRequest<ApiEnvelope<CorporateMilestone>>(
    `/api/v1/admin/corporate/milestones/${id}`,
    {
      method: "PATCH",
      body: JSON.stringify(body),
    },
  );
}

export async function deleteMilestoneAdmin(id: string) {
  return apiRequest<undefined>(`/api/v1/admin/corporate/milestones/${id}`, {
    method: "DELETE",
  });
}
