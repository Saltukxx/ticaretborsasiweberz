import { apiRequest, type ApiEnvelope } from "./http";

export type CorporateDocumentCategory =
  | "politika"
  | "tarihce"
  | "plan"
  | "organizasyon";

export type CorporateDocumentRow = {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  body: string | null;
  category: CorporateDocumentCategory | string;
  fileId: string;
  sortOrder: number;
  isPublished: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

export async function listCorporateDocumentsAdmin() {
  return apiRequest<{ data: CorporateDocumentRow[]; meta: { total: number } }>(
    "/api/v1/admin/corporate/documents",
  );
}

export async function getCorporateDocumentAdmin(id: string) {
  return apiRequest<ApiEnvelope<CorporateDocumentRow>>(
    `/api/v1/admin/corporate/documents/${id}`,
  );
}

export async function patchCorporateDocumentAdmin(
  id: string,
  body: Record<string, unknown>,
) {
  return apiRequest<ApiEnvelope<CorporateDocumentRow>>(
    `/api/v1/admin/corporate/documents/${id}`,
    {
      method: "PATCH",
      body: JSON.stringify(body),
    },
  );
}

export const CORPORATE_DOC_CATEGORY_LABELS: Record<string, string> = {
  tarihce: "Tarihçe",
  organizasyon: "Organizasyon",
  plan: "İş Planı",
  politika: "Kurumsal Politika",
};
