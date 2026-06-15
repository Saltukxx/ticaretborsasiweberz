import { apiRequest, type ApiEnvelope } from "./http";

// --- Products ---
export type ProductRow = {
  id: string;
  slug: string;
  name: string;
  category: string;
  unit: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export async function listProductsAdmin(params?: { q?: string; activeOnly?: boolean }) {
  const sp = new URLSearchParams();
  if (params?.q) sp.set("q", params.q);
  if (params?.activeOnly !== undefined)
    sp.set("activeOnly", params.activeOnly ? "true" : "false");
  const qs = sp.toString();
  return apiRequest<{ data: ProductRow[] }>(
    `/api/v1/admin/products${qs ? `?${qs}` : ""}`,
  );
}

export async function getProductAdmin(id: string) {
  return apiRequest<ApiEnvelope<ProductRow>>(`/api/v1/admin/products/${id}`);
}

export async function createProductAdmin(body: Record<string, unknown>) {
  return apiRequest<ApiEnvelope<ProductRow>>("/api/v1/admin/products", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function patchProductAdmin(id: string, body: Record<string, unknown>) {
  return apiRequest<ApiEnvelope<ProductRow>>(`/api/v1/admin/products/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

// --- Price entries ---
export type PriceEntryRow = {
  id: string;
  productId: string;
  entryDate: string;
  avgPrice: string;
  lowPrice: string;
  highPrice: string;
  changePct: string | null;
  volume: string | null;
  volumeUnit: string | null;
  sessionTime: string | null;
  createdAt: string;
  updatedAt: string;
};

export async function listPriceEntriesAdmin(params: {
  limit: number;
  offset: number;
  productId?: string;
  from?: string;
  to?: string;
}) {
  const sp = new URLSearchParams({
    limit: String(params.limit),
    offset: String(params.offset),
  });
  if (params.productId) sp.set("productId", params.productId);
  if (params.from) sp.set("from", params.from);
  if (params.to) sp.set("to", params.to);
  return apiRequest<{
    data: PriceEntryRow[];
    meta: { total: number; limit: number; offset: number };
  }>(`/api/v1/admin/prices?${sp.toString()}`);
}

export async function createPriceEntryAdmin(body: Record<string, unknown>) {
  return apiRequest<ApiEnvelope<PriceEntryRow>>("/api/v1/admin/prices", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function patchPriceEntryAdmin(id: string, body: Record<string, unknown>) {
  return apiRequest<ApiEnvelope<PriceEntryRow>>(`/api/v1/admin/prices/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function deletePriceEntryAdmin(id: string) {
  return apiRequest<undefined>(`/api/v1/admin/prices/${id}`, { method: "DELETE" });
}

export async function bulkPriceEntriesAdmin(rows: unknown[]) {
  return apiRequest<{ data: { upserted: number } }>("/api/v1/admin/prices/bulk", {
    method: "POST",
    body: JSON.stringify({ rows }),
  });
}
