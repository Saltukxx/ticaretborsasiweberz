import { Link } from "react-router-dom";
import { currencies, products } from "../data/market";
import Sparkline from "./Sparkline";
import { useReveal } from "../hooks/useReveal";
import "./MarketPriceOverview.css";

export default function MarketPriceOverview() {
  const headRef = useReveal<HTMLDivElement>();
  const cursRef = useReveal<HTMLDivElement>();
  const gridRef = useReveal<HTMLDivElement>();
  const shown = products.slice(0, 6);

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
                <strong>{c.value}</strong>
                <span className={c.up ? "is-up" : "is-down"}>{c.change}</span>
              </span>
            ))}
          </div>
        </div>

        <div className="mpov__grid reveal" ref={gridRef}>
          {shown.map((p) => {
            const up = p.change >= 0;
            return (
              <article key={p.id} className="mpov__tile card">
                <div className="mpov__tile-top">
                  <h3>{p.name}</h3>
                  <span className={`mono mpov__tile-chg ${up ? "is-up" : "is-down"}`}>
                    {up ? "+" : ""}
                    {p.change}%
                  </span>
                </div>
                <p className="mono mpov__tile-price">
                  {p.avg.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                  <span>{p.unit}</span>
                </p>
                <Sparkline width={340} height={52} data={p.series} color={up ? "var(--c-green-600)" : "var(--c-red-500)"} />
                <div className="mono mpov__tile-meta">
                  <span>Hacim {p.volume}</span>
                  <span>{p.updated}</span>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
