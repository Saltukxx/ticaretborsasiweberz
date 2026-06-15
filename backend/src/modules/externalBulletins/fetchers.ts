import { DatabankClient } from "../databankSync/client.js";
import { parseTescilBulletinHtml } from "../databankSync/parsers/htmlTable.js";
import type { ExternalBulletinSourceConfig } from "./sources.js";
import type { ExternalBulletinRow } from "./types.js";
import { parseTurkishMoney } from "./parseNumbers.js";
import { parseKtbAnlikBulletinJson } from "./parsers/ktbJson.js";

const FETCH_TIMEOUT_MS = 25_000;

function mapTescilRows(
  parsed: ReturnType<typeof parseTescilBulletinHtml>,
): ExternalBulletinRow[] {
  return parsed
    .map((row) => {
      const low = parseTurkishMoney(row.low);
      const high = parseTurkishMoney(row.high);
      const avg = parseTurkishMoney(row.avg);
      if (low == null || high == null || avg == null) return null;
      return {
        productName: row.productName,
        category: row.category,
        saleType: row.saleType || null,
        lowPrice: low,
        highPrice: high,
        avgPrice: avg,
        volume: parseTurkishMoney(row.volume),
        volumeUnit: row.volumeUnit,
        transactionAmount: parseTurkishMoney(row.transactionAmount),
        transactionCount: row.transactionCount,
      } satisfies ExternalBulletinRow;
    })
    .filter((r): r is ExternalBulletinRow => r != null);
}

async function fetchWithTimeout(url: string, init?: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
      headers: {
        "User-Agent": "ETB-ExternalBulletins/1.0 (+https://erzurumtb.org.tr)",
        Accept: "text/html,application/json",
        ...(init?.headers ?? {}),
      },
    });
  } finally {
    clearTimeout(timer);
  }
}

async function fetchDatabankTescil(
  source: ExternalBulletinSourceConfig,
  sessionDate: string,
): Promise<ExternalBulletinRow[]> {
  const client = new DatabankClient({
    baseUrl: source.databankBaseUrl!,
    requestDelayMs: 0,
  });
  const html = await client.fetchTescilBulletin("D", sessionDate);
  return mapTescilRows(parseTescilBulletinHtml(html));
}

async function fetchKtbJson(
  source: ExternalBulletinSourceConfig,
  sessionDate: string,
): Promise<ExternalBulletinRow[]> {
  const url = `${source.ktbApiBaseUrl!.replace(/\/$/, "")}/api/v1/Alpha.WebPanel/OnlineKullaniciBulten/GetAnlikBulten/${sessionDate}`;
  const res = await fetchWithTimeout(url, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) {
    throw new Error(`KTB HTTP ${res.status}`);
  }
  const json: unknown = await res.json();
  return parseKtbAnlikBulletinJson(json);
}

export async function fetchExternalSourceRows(
  source: ExternalBulletinSourceConfig,
  sessionDate: string,
): Promise<ExternalBulletinRow[]> {
  switch (source.kind) {
    case "databank-tescil":
      return fetchDatabankTescil(source, sessionDate);
    case "ktb-json":
      return fetchKtbJson(source, sessionDate);
    default:
      return [];
  }
}
