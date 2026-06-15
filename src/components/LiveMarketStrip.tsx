import { useMarketTicker } from "../hooks/usePublicApi";
import {
  formatTickerChange,
  formatTickerValue,
  tickerDirection,
} from "../lib/marketTickerDisplay";
import "./LiveMarketStrip.css";

export default function LiveMarketStrip() {
  const { data, isLoading, isError } = useMarketTicker();
  const items = data?.items ?? [];
  const list = items.length > 0 ? [...items, ...items] : [];
  const updatedAt = data?.updatedAt
    ? new Date(data.updatedAt).toLocaleTimeString("tr-TR", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });

  if (isError || (!isLoading && items.length === 0)) return null;

  return (
    <div className="ticker" aria-label="Canlı piyasa bandı">
      <div className="ticker__viewport">
        <div className={`ticker__track${isLoading ? " ticker__track--loading" : ""}`}>
          {(isLoading ? Array.from({ length: 4 }, (_, i) => i) : list).map((entry, i) => {
            if (isLoading) {
              return (
                <div key={`sk-${i}`} className="ticker__item ticker__item--skeleton">
                  <span className="ticker__code mono">···</span>
                  <span className="ticker__value mono tabular">—</span>
                </div>
              );
            }
            const item = entry as (typeof items)[number];
            const dir = tickerDirection(item);
            const change = formatTickerChange(item);
            return (
              <div key={`${item.code}-${i}`} className="ticker__item">
                <span className="ticker__code mono">{item.label}</span>
                <span className="ticker__value mono tabular">{formatTickerValue(item)}</span>
                {change ? (
                  <span
                    className={`ticker__chg mono ${
                      dir > 0 ? "is-up" : dir < 0 ? "is-down" : "is-flat"
                    }`}
                  >
                    {dir > 0 ? "▲" : dir < 0 ? "▼" : "—"} {change}
                  </span>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
      <div className="ticker__time mono">
        {data?.source === "live" ? "Canlı" : "Yedek"} · {updatedAt}
      </div>
    </div>
  );
}
