import { apiRequest, type ApiEnvelope } from "./http";

export type CurrencyRateRow = {
  id: string;
  code: string;
  label: string | null;
  rateValue: string;
  changePct: string | null;
  direction: number | null;
  createdAt: string;
  createdBy: string;
};

export async function listCurrencyRatesAdmin(params: {
  limit: number;
  offset: number;
  code?: string;
}) {
  const sp = new URLSearchParams({
    limit: String(params.limit),
    offset: String(params.offset),
  });
  if (params.code) sp.set("code", params.code);
  return apiRequest<{
    data: CurrencyRateRow[];
    meta: { total: number; limit: number; offset: number };
  }>(`/api/v1/admin/currency-rates?${sp.toString()}`);
}

export async function createCurrencyRateAdmin(body: Record<string, unknown>) {
  return apiRequest<ApiEnvelope<CurrencyRateRow>>("/api/v1/admin/currency-rates", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function deleteCurrencyRateAdmin(id: string) {
  return apiRequest<undefined>(`/api/v1/admin/currency-rates/${id}`, {
    method: "DELETE",
  });
}
