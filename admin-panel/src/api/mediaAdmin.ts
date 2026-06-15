import { apiRequest, type ApiEnvelope } from "./http";

export type MediaRow = {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  publicUrl: string;
  width: number | null;
  height: number | null;
  altText: string | null;
  createdAt: string;
};

export async function listMediaAdmin(params: {
  limit: number;
  offset: number;
  q?: string;
  mimePrefix?: string;
}) {
  const sp = new URLSearchParams({
    limit: String(params.limit),
    offset: String(params.offset),
  });
  if (params.q) sp.set("q", params.q);
  if (params.mimePrefix) sp.set("mimePrefix", params.mimePrefix);
  return apiRequest<{ data: MediaRow[]; meta: { total: number; limit: number; offset: number } }>(
    `/api/v1/admin/media?${sp.toString()}`,
  );
}

export async function uploadMediaAdmin(file: File) {
  const body = new FormData();
  body.append("file", file);
  return apiRequest<ApiEnvelope<MediaRow>>("/api/v1/admin/media/upload", {
    method: "POST",
    body,
  });
}

export async function patchMediaAdmin(id: string, altText: string | null) {
  return apiRequest<ApiEnvelope<MediaRow>>(`/api/v1/admin/media/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ altText }),
  });
}

export async function deleteMediaAdmin(id: string) {
  return apiRequest<undefined>(`/api/v1/admin/media/${id}`, { method: "DELETE" });
}
