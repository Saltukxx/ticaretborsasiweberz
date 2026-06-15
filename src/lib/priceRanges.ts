import type { PriceHistoryPeriod } from "./publicApi";

export const PRICE_RANGE_LABELS = ["Günlük", "Haftalık", "Aylık", "Yıllık"] as const;
export type PriceRangeLabel = (typeof PRICE_RANGE_LABELS)[number];

export const RANGE_TO_PERIOD: Record<PriceRangeLabel, PriceHistoryPeriod> = {
  Günlük: "7d",
  Haftalık: "30d",
  Aylık: "90d",
  Yıllık: "365d",
};
