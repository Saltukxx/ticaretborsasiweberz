import { apiRequest, type ApiEnvelope } from "./http";

export type ProjectPhase = {
  label: string;
  done: boolean;
};

export type ProjectMetric = {
  value: string;
  label: string;
};

export type ProjectIcon = "digital" | "data" | "lab";
export type ProjectStatus = "ongoing" | "completed";

export type ProjectRow = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  body: string | null;
  status: ProjectStatus;
  field: string | null;
  progress: number | null;
  targetLabel: string | null;
  phaseLabel: string | null;
  phases: ProjectPhase[];
  outputs: string[];
  icon: ProjectIcon | null;
  year: string | null;
  impact: string | null;
  result: string | null;
  metric: ProjectMetric | null;
  sortOrder: number;
  coverImage: string | null;
  startedAt: string | null;
  completedAt: string | null;
  isPublished: boolean;
  publishedAt: string | null;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export async function listProjectsAdmin(params: {
  limit: number;
  offset: number;
  scope: "active" | "deleted" | "all";
  status?: ProjectStatus;
  q?: string;
}) {
  const sp = new URLSearchParams({
    limit: String(params.limit),
    offset: String(params.offset),
    scope: params.scope,
  });
  if (params.status) sp.set("status", params.status);
  if (params.q) sp.set("q", params.q);
  return apiRequest<{
    data: ProjectRow[];
    meta: { total: number; limit: number; offset: number };
  }>(`/api/v1/admin/projects?${sp.toString()}`);
}

export async function getProjectAdmin(id: string) {
  return apiRequest<ApiEnvelope<ProjectRow>>(`/api/v1/admin/projects/${id}`);
}

export async function createProjectAdmin(body: Record<string, unknown>) {
  return apiRequest<ApiEnvelope<ProjectRow>>("/api/v1/admin/projects", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function patchProjectAdmin(id: string, body: Record<string, unknown>) {
  return apiRequest<ApiEnvelope<ProjectRow>>(`/api/v1/admin/projects/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function publishProjectAdmin(id: string) {
  return apiRequest<ApiEnvelope<ProjectRow>>(`/api/v1/admin/projects/${id}/publish`, {
    method: "POST",
  });
}

export async function unpublishProjectAdmin(id: string) {
  return apiRequest<ApiEnvelope<ProjectRow>>(`/api/v1/admin/projects/${id}/unpublish`, {
    method: "POST",
  });
}

export async function softDeleteProjectAdmin(id: string) {
  return apiRequest<ApiEnvelope<ProjectRow>>(`/api/v1/admin/projects/${id}`, {
    method: "DELETE",
  });
}

export async function hardDeleteProjectAdmin(id: string) {
  return apiRequest<undefined>(`/api/v1/admin/projects/${id}/permanent`, {
    method: "DELETE",
  });
}
