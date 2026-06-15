import type { MarketTickerItem } from "./publicApi";

export function formatTickerValue(item: MarketTickerItem): string {
  if (item.unit === "index") {
    return item.value.toLocaleString("tr-TR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }
  if (item.unit === "fx") {
    return item.value.toLocaleString("tr-TR", {
      minimumFractionDigits: 4,
      maximumFractionDigits: 4,
    });
  }
  return `${item.value.toLocaleString("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ₺`;
}

export function formatTickerChange(item: MarketTickerItem): string | null {
  if (item.changePct == null) return null;
  const sign = item.changePct >= 0 ? "+" : "";
  return `${sign}${item.changePct.toLocaleString("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}%`;
}

export function tickerDirection(item: MarketTickerItem): number {
  if (item.direction != null) return item.direction;
  if (item.changePct == null) return 0;
  return item.changePct >= 0 ? 1 : -1;
}
