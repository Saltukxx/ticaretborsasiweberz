import { useMemo, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import { useCurrencyRates, useCurrentPrices } from "../hooks/usePublicApi";
import type { PublicCurrencyRate } from "../lib/publicApi";
import { compareByVolumeDesc } from "../lib/bulletinFilters";
import { marqueeDuration, marqueeHalfLength, marqueeLoop } from "../lib/marqueeLoop";
import { formatChangePct, formatPrice, hasChangePct } from "../lib/priceDisplay";
import "./HomePulseMarquee.css";

type MarketRow = {
  id: string;
  label: string;
  value: string;
  changePct: number | null;
  direction: number | null;
};

function formatRate(rate: PublicCurrencyRate): string {
  return rate.rateValue.toLocaleString("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  });
}

function rowDirection(changePct: number | null, direction: number | null): number {
  if (direction != null) return direction;
  if (changePct == null) return 0;
  return changePct >= 0 ? 1 : -1;
}

export default function HomeLiveMarketMarquee() {
  const { data: currencies, isLoading: loadingFx, isError: errorFx, isFetched: fxFetched } =
    useCurrencyRates();
  const { data: prices, isLoading: loadingPrices, isFetched: pricesFetched } = useCurrentPrices();

  const items = useMemo(() => {
    const rows: MarketRow[] = [];

    for (const c of currencies ?? []) {
      rows.push({
        id: `fx-${c.id}`,
        label: c.code,
        value: formatRate(c),
        changePct: c.changePct,
        direction: c.direction ?? null,
      });
    }

    const topPrices = [...(prices ?? [])].sort(compareByVolumeDesc).slice(0, 14);
    for (const p of topPrices) {
      if (p.avg_price == null) continue;
      rows.push({
        id: `px-${p.product_id}`,
        label: p.product_name,
        value: `${formatPrice(p.avg_price)} ${p.product_unit}`,
        changePct: p.change_pct,
        direction: hasChangePct(p.change_pct) ? (p.change_pct >= 0 ? 1 : -1) : null,
      });
    }

    return rows;
  }, [currencies, prices]);

  const allFetched = fxFetched && pricesFetched;
  const showLoading = items.length === 0 && (loadingFx || loadingPrices);

  if ((errorFx && allFetched && items.length === 0) || (allFetched && items.length === 0)) {
    return null;
  }

  const loop = items.length > 0 ? marqueeLoop(items, 10) : [];
  const trackStyle = loop.length
    ? ({
        "--pulse-duration": `${marqueeDuration(marqueeHalfLength(loop), "market")}s`,
      } as CSSProperties)
    : undefined;
  const updatedAt = new Date().toLocaleTimeString("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <section className="pulse-bar pulse-bar--market" aria-label="Canlı piyasa özeti">
      <div className="container pulse-bar__inner">
        <span className="pulse-bar__label mono">
          <span className="pulse-bar__dot" aria-hidden="true" />
          Canlı Piyasa
        </span>

        <div className={`pulse-bar__viewport${showLoading ? " pulse-bar__viewport--loading" : ""}`}>
          <div className={`pulse-bar__track${showLoading ? " pulse-bar__track--idle" : ""}`} style={trackStyle}>
            {showLoading ? (
              <span className="pulse-bar__loading mono" aria-hidden="true">
                Piyasa verileri yükleniyor…
              </span>
            ) : (
              loop.map((item, index) => {
                const dir = rowDirection(item.changePct, item.direction);
                return (
                  <span className="pulse-bar__item" key={`${item.id}-${index}`}>
                    <span className="pulse-bar__code mono">{item.label}</span>
                    <strong className="pulse-bar__value mono tabular">{item.value}</strong>
                    {item.changePct != null ? (
                      <span
                        className={`pulse-bar__change mono ${
                          dir >= 0 ? "is-up" : "is-down"
                        }`}
                      >
                        {dir >= 0 ? "▲" : "▼"} {formatChangePct(item.changePct)}
                      </span>
                    ) : null}
                  </span>
                );
              })
            )}
          </div>
        </div>

        <span className="pulse-bar__time mono">
          <Link className="btn-link" to="/fiyat-bulteni">
            Bülten
          </Link>
          {" · "}
          {updatedAt}
        </span>
      </div>
    </section>
  );
}
