import { apiRequest, type ApiEnvelope } from "./http";

export const LEADERSHIP_GROUPS = [
  { value: "yonetim_kurulu", label: "Yönetim Kurulu" },
  { value: "meclis", label: "Meclis" },
  { value: "tobb_delegeleri", label: "TOBB Delegeleri" },
  { value: "personel", label: "Genel Sekreterlik / Personel" },
  { value: "danisman", label: "Danışman" },
] as const;

export type LeadershipGroupKey = (typeof LEADERSHIP_GROUPS)[number]["value"];

export function leadershipGroupLabel(key: string | null | undefined): string {
  return LEADERSHIP_GROUPS.find((g) => g.value === key)?.label ?? key ?? "—";
}

export type LeadershipRow = {
  id: string;
  roleKey: string;
  groupKey: string;
  name: string;
  title: string;
  messageTitle: string | null;
  eyebrow: string | null;
  quoteLines: string[] | null;
  portraitId: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export async function listLeadershipAdmin(params: {
  limit: number;
  offset: number;
  active: "all" | "true" | "false";
  groupKey?: LeadershipGroupKey;
  q?: string;
}) {
  const sp = new URLSearchParams({
    limit: String(params.limit),
    offset: String(params.offset),
    active: params.active,
  });
  if (params.groupKey) sp.set("groupKey", params.groupKey);
  if (params.q) sp.set("q", params.q);
  return apiRequest<{
    data: LeadershipRow[];
    meta: { total: number; limit: number; offset: number };
  }>(`/api/v1/admin/leadership?${sp.toString()}`);
}

const TR_MAP: Record<string, string> = {
  ç: "c", Ç: "c", ğ: "g", Ğ: "g", ı: "i", İ: "i", I: "i",
  ö: "o", Ö: "o", ş: "s", Ş: "s", ü: "u", Ü: "u",
};

const GROUP_PREFIX: Record<LeadershipGroupKey, string> = {
  yonetim_kurulu: "yk",
  meclis: "meclis",
  tobb_delegeleri: "tobb",
  personel: "personel",
  danisman: "danisman",
};

/** Client-side preview; server generates authoritative roleKey on create. */
export function previewRoleKey(groupKey: LeadershipGroupKey, name: string): string {
  const prefix = GROUP_PREFIX[groupKey];
  const cleaned = name.replace(/^(prof\.?\s*dr\.?|dr\.?|av\.?)\s+/i, "").trim();
  const parts = cleaned
    .split(/\s+/)
    .map((part) =>
      part
        .split("")
        .map((ch) => TR_MAP[ch] ?? ch)
        .join("")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, ""),
    )
    .filter(Boolean);
  const slug = parts.join("_").slice(0, 80);
  return slug ? `${prefix}_${slug}` : `${prefix}_uye`;
}

export const PRESIDENT_ROLE_KEY = "baskan";

export async function getLeadershipAdmin(id: string) {
  return apiRequest<ApiEnvelope<LeadershipRow>>(`/api/v1/admin/leadership/${id}`);
}

export async function createLeadershipAdmin(body: Record<string, unknown>) {
  return apiRequest<ApiEnvelope<LeadershipRow>>("/api/v1/admin/leadership", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function patchLeadershipAdmin(id: string, body: Record<string, unknown>) {
  return apiRequest<ApiEnvelope<LeadershipRow>>(`/api/v1/admin/leadership/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function deleteLeadershipAdmin(id: string) {
  return apiRequest<undefined>(`/api/v1/admin/leadership/${id}`, {
    method: "DELETE",
  });
}
