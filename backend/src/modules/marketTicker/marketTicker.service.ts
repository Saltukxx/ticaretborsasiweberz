import type { Database } from "../../db/connection.js";
import type { RedisClient } from "../../lib/redis.js";
import { getCached } from "../../lib/cache.js";
import {
  MARKET_TICKER_CACHE_TTL_SEC,
  marketTickerCacheKey,
} from "../../lib/marketTickerCache.js";
import { fetchLatestCurrencyRates } from "../currencyRates/currencyRates.public.service.js";
import type {
  MarketTickerItem,
  MarketTickerPayload,
  TruncgilFinanceResponse,
  TruncgilRate,
} from "./types.js";

const DEFAULT_FINANCE_URL = "https://finance.truncgil.com/api/today.json";
const FETCH_TIMEOUT_MS = 12_000;

function num(v: unknown): number | null {
  if (v == null || v === "") return null;
  const n = typeof v === "number" ? v : Number(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

function directionFromChange(change: number | null): number | null {
  if (change == null || change === 0) return 0;
  return change > 0 ? 1 : -1;
}

function itemFromRate(
  code: string,
  label: string,
  rate: TruncgilRate | undefined,
  unit: MarketTickerItem["unit"],
): MarketTickerItem | null {
  if (!rate) return null;
  const value = num(rate.Selling) ?? num(rate.Buying);
  if (value == null || value <= 0) return null;
  const changePct = num(rate.Change);
  return {
    code,
    label,
    value,
    changePct,
    direction: directionFromChange(changePct),
    unit,
  };
}

export function parseTruncgilFinancePayload(
  json: TruncgilFinanceResponse,
): MarketTickerItem[] {
  const rates = json.Rates ?? {};
  const items: MarketTickerItem[] = [];

  const bist = itemFromRate("BIST100", "BIST 100", rates.XU100, "index");
  const usd = itemFromRate("USDTRY", "USD/TRY", rates.USD, "fx");
  const eur = itemFromRate("EURTRY", "EUR/TRY", rates.EUR, "fx");
  const gold = itemFromRate("ALTIN", "Gram Altın", rates.GRA, "try");

  for (const row of [bist, usd, eur, gold]) {
    if (row) items.push(row);
  }
  return items;
}

export async function fetchTruncgilFinanceTicker(
  url = DEFAULT_FINANCE_URL,
): Promise<{ items: MarketTickerItem[]; updatedAt: string | null }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
    if (!res.ok) throw new Error(`finance_api_${res.status}`);
    const json = (await res.json()) as TruncgilFinanceResponse;
    const items = parseTruncgilFinancePayload(json);
    if (items.length === 0) throw new Error("finance_api_empty");
    const updatedAt =
      json.Meta_Data?.Update_Date ??
      json.Meta_Data?.Current_Date ??
      new Date().toISOString();
    return { items, updatedAt };
  } finally {
    clearTimeout(timer);
  }
}

async function fallbackFromDb(db: Database): Promise<MarketTickerItem[]> {
  const rows = await fetchLatestCurrencyRates(db);
  const labelFor: Record<string, string> = {
    USD: "USD/TRY",
    EUR: "EUR/TRY",
    BIST100: "BIST 100",
    ALTIN: "Gram Altın",
  };
  const unitFor: Record<string, MarketTickerItem["unit"]> = {
    USD: "fx",
    EUR: "fx",
    BIST100: "index",
    ALTIN: "try",
  };
  const order = ["BIST100", "USD", "EUR", "ALTIN"];
  const byCode = new Map(rows.map((r) => [r.code, r]));
  const items: MarketTickerItem[] = [];

  for (const code of order) {
    const row = byCode.get(code);
    if (!row) continue;
    items.push({
      code: code === "USD" ? "USDTRY" : code === "EUR" ? "EURTRY" : code,
      label: labelFor[code] ?? row.label ?? code,
      value: row.rateValue,
      changePct: row.changePct,
      direction: row.direction,
      unit: unitFor[code] ?? "try",
    });
  }

  if (items.length === 0) {
    for (const row of rows.slice(0, 6)) {
      items.push({
        code: row.code,
        label: row.label ?? row.code,
        value: row.rateValue,
        changePct: row.changePct,
        direction: row.direction,
        unit: row.code === "USD" || row.code === "EUR" ? "fx" : "try",
      });
    }
  }

  return items;
}

export async function buildMarketTickerPayload(
  db: Database,
  financeUrl = DEFAULT_FINANCE_URL,
): Promise<MarketTickerPayload> {
  try {
    const live = await fetchTruncgilFinanceTicker(financeUrl);
    return {
      items: live.items,
      source: "live",
      updatedAt: live.updatedAt,
    };
  } catch {
    const items = await fallbackFromDb(db);
    return {
      items,
      source: "fallback",
      updatedAt: items.length > 0 ? new Date().toISOString() : null,
    };
  }
}

export async function getMarketTickerPayload(
  db: Database,
  redis: RedisClient | null,
  redisPrefix: string,
  financeUrl = DEFAULT_FINANCE_URL,
): Promise<MarketTickerPayload> {
  return getCached(
    redis,
    marketTickerCacheKey(redisPrefix),
    MARKET_TICKER_CACHE_TTL_SEC,
    () => buildMarketTickerPayload(db, financeUrl),
  );
}
