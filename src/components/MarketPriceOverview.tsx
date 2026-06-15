import { Link } from "react-router-dom";
import { useCurrencyRates, useCurrentPrices } from "../hooks/usePublicApi";
import {
  changeDirection,
  formatChangePct,
  formatPrice,
  formatVolume,
  hasChangePct,
} from "../lib/priceDisplay";
import Sparkline from "./Sparkline";
import { useReveal } from "../hooks/useReveal";
import "./MarketPriceOverview.css";

export default function MarketPriceOverview() {
  const headRef = useReveal<HTMLDivElement>();
  const cursRef = useReveal<HTMLDivElement>();
  const gridRef = useReveal<HTMLDivElement>();

  const { data: currencyData, isLoading: fxLoading } = useCurrencyRates();
  const { data: priceData, isLoading: pricesLoading } = useCurrentPrices();

  const currencies = currencyData ?? [];
  const products = priceData ?? [];
  const shown = products.slice(0, 6);
  const empty = !pricesLoading && !fxLoading && products.length === 0 && currencies.length === 0;

  return (
    <section className="mpov">
      <div className="container">
        <div className="mpov__head section-title reveal" ref={headRef}>
          <div>
            <span className="eyebrow">Piyasa Özeti · Anlık</span>
            <h2 className="mpov__h2">
              Ürün ve kur <em>panosu</em>
            </h2>
          </div>
          <p>
            Tescilli işlemlere dayalı seçili ürün ortalamaları ve güncel kur referansları. Detaylı sekmeler, filtreler ve tam grafik görünümü için fiyat
            bülteni sayfasını kullanın.
          </p>
          <Link className="btn btn-primary mpov__head-cta" to="/fiyat-bulteni">
            Tam fiyat bültenine git
          </Link>
        </div>

        <div className="mpov__currencies card reveal" ref={cursRef}>
          <span className="mono mpov__currencies-label">Referans Göstergeler</span>
          <div className="mpov__currencies-strip" role="list">
            {currencies.map((c) => (
              <span key={c.code} className="mpov__cur mono" role="listitem">
                <span>{c.code}</span>
                <strong>
                  {c.rateValue.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                </strong>
                <span className={(c.direction ?? 0) >= 0 ? "is-up" : "is-down"}>
                  {c.changePct != null
                    ? `${c.changePct >= 0 ? "+" : ""}${c.changePct.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`
                    : ""}
                </span>
              </span>
            ))}
          </div>
        </div>

        {empty ? (
          <p className="mpov__empty mono">
            Piyasa özeti şu an görüntülenemiyor. Güncel fiyat ve kur bilgileri yayımlandığında bu bölümde
            yer alacaktır.
          </p>
        ) : null}

        <div className="mpov__grid reveal" ref={gridRef}>
          {shown.map((p) => {
            const dir = changeDirection(p.change_pct);
            const up = dir === "up";
            const down = dir === "down";
            const updatedStr = p.entry_date
              ? new Date(p.entry_date).toLocaleDateString("tr-TR", { day: "numeric", month: "short" })
              : "—";
            return (
              <article key={p.product_slug} className="mpov__tile card">
                <div className="mpov__tile-top">
                  <h3>{p.product_name}</h3>
                  <span
                    className={`mono mpov__tile-chg ${
                      hasChangePct(p.change_pct)
                        ? up
                          ? "is-up"
                          : "is-down"
                        : "mpov__tile-chg--na"
                    }`}
                  >
                    {formatChangePct(p.change_pct)}
                  </span>
                </div>
                <p className="mono mpov__tile-price">
                  {formatPrice(p.avg_price)}
                  <span>{p.product_unit}</span>
                </p>
                <Sparkline
                  width={340}
                  height={52}
                  data={p.sparkline_series ?? []}
                  color={down ? "var(--c-red-500)" : "var(--c-green-600)"}
                />
                <div className="mono mpov__tile-meta">
                  <span>Hacim {formatVolume(p)}</span>
                  <span>{updatedStr}</span>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
