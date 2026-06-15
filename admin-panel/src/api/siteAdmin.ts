import { getAccessToken } from "@/auth/token";
import { apiRequest, getBase, type ApiEnvelope } from "./http";

export type SiteContact = {
  address: string | null;
  phone: string | null;
  fax: string | null;
  emailPrimary: string | null;
  emailSecondary: string | null;
  hours: string | null;
  socialLinkedin: string | null;
  socialX: string | null;
  socialYoutube: string | null;
  socialInstagram: string | null;
};

export type ContactSubmission = {
  id: string;
  fullName: string;
  organization: string | null;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  status: "new" | "read" | "archived";
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
};

export type NewsletterSubscriber = {
  id: string;
  email: string;
  frequency: "daily" | "weekly" | "monthly";
  status: "active" | "unsubscribed";
  ipAddress: string | null;
  createdAt: string;
  unsubscribedAt: string | null;
};

export type LegalPage = {
  slug: string;
  title: string;
  body: string;
  isPublished: boolean;
  updatedAt: string;
};

export async function getSiteContactAdmin() {
  return apiRequest<ApiEnvelope<SiteContact>>("/api/v1/admin/site/contact");
}

export async function patchSiteContactAdmin(body: Record<string, unknown>) {
  return apiRequest<ApiEnvelope<SiteContact>>("/api/v1/admin/site/contact", {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function listContactSubmissionsAdmin(params: {
  limit: number;
  offset: number;
  status?: "new" | "read" | "archived" | "all";
}) {
  const q = new URLSearchParams();
  q.set("limit", String(params.limit));
  q.set("offset", String(params.offset));
  if (params.status) q.set("status", params.status);
  return apiRequest<{ data: ContactSubmission[]; meta: { total: number } }>(
    `/api/v1/admin/contact-submissions?${q}`,
  );
}

export async function getContactSubmissionAdmin(id: string) {
  return apiRequest<ApiEnvelope<ContactSubmission>>(
    `/api/v1/admin/contact-submissions/${id}`,
  );
}

export async function patchContactSubmissionAdmin(
  id: string,
  status: "new" | "read" | "archived",
) {
  return apiRequest<ApiEnvelope<ContactSubmission>>(
    `/api/v1/admin/contact-submissions/${id}`,
    { method: "PATCH", body: JSON.stringify({ status }) },
  );
}

export async function listNewsletterSubscribersAdmin(params: {
  limit: number;
  offset: number;
  status?: "active" | "unsubscribed" | "all";
}) {
  const q = new URLSearchParams();
  q.set("limit", String(params.limit));
  q.set("offset", String(params.offset));
  if (params.status) q.set("status", params.status);
  return apiRequest<{ data: NewsletterSubscriber[]; meta: { total: number } }>(
    `/api/v1/admin/newsletter-subscribers?${q}`,
  );
}

export async function downloadNewsletterCsv(status: "active" | "unsubscribed" | "all" = "active") {
  const token = getAccessToken();
  const q = new URLSearchParams({ status, limit: "10000", offset: "0" });
  const res = await fetch(
    `${getBase()}/api/v1/admin/newsletter-subscribers/export?${q}`,
    {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      credentials: "include",
    },
  );
  if (!res.ok) throw new Error("CSV indirilemedi");
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "newsletter-subscribers.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export async function listLegalPagesAdmin() {
  return apiRequest<{ data: LegalPage[] }>("/api/v1/admin/legal-pages");
}

export async function patchLegalPageAdmin(
  slug: string,
  body: Partial<{ title: string; body: string; isPublished: boolean }>,
) {
  return apiRequest<ApiEnvelope<LegalPage>>(`/api/v1/admin/legal-pages/${slug}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}
