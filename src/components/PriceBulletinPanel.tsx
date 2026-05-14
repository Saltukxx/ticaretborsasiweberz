import { useState } from "react";
import { Product, products } from "../data/market";
import Sparkline from "./Sparkline";
import { useReveal } from "../hooks/useReveal";
import "./PriceBulletinPanel.css";

const ranges = ["Günlük", "Haftalık", "Aylık", "Yıllık"] as const;
const filters = ["Tümü", "Hububat", "Yem", "Tarımsal", "Hayvancılık", "Karışık"] as const;

export default function PriceBulletinPanel() {
  const [range, setRange] = useState<(typeof ranges)[number]>("Günlük");
  const [filter, setFilter] = useState<(typeof filters)[number]>("Tümü");
  const [active, setActive] = useState<Product>(products[0]);

  const refHead = useReveal<HTMLDivElement>();
  const refGrid = useReveal<HTMLDivElement>();

  const visible =
    filter === "Tümü" ? products : products.filter((p) => p.category === filter);

  return (
    <section className="pbp">
      <div className="container">
        <div className="pbp__head reveal" ref={refHead}>
          <div>
            <span className="eyebrow">Fiyat Bülteni · Canlı Veri</span>
            <h2>
              Güncel <em className="pbp__head-em">Fiyat Bülteni</em>
            </h2>
            <p>
              Ürün bazlı fiyat hareketlerini, günlük ortalamaları ve piyasa
              eğilimlerini tek ekranda takip edin. Tüm değerler tescilli işlemlere
              dayanır.
            </p>
          </div>
          <div className="pbp__head-actions">
            <a className="btn btn-ghost" href="/fiyat-bulteni">Tüm Fiyatları Gör</a>
            <a className="btn btn-primary" href="#">PDF Olarak İndir</a>
          </div>
        </div>

        <div className="pbp__shell">
          <div className="pbp__toolbar">
            <div className="pbp__tabs">
              {ranges.map((r) => (
                <button
                  key={r}
                  className={`pbp__tab ${range === r ? "is-active" : ""}`}
                  onClick={() => setRange(r)}
                >
                  {r}
                </button>
              ))}
            </div>
            <div className="pbp__filters">
              {filters.map((f) => (
                <button
                  key={f}
                  className={`pbp__chip ${filter === f ? "is-active" : ""}`}
                  onClick={() => setFilter(f)}
                >
                  {f}
                </button>
              ))}
            </div>
            <div className="pbp__date mono">
              <span>12 Mayıs 2026 · 16:42</span>
              <span className="pbp__pulse" />
            </div>
          </div>

          <div className="pbp__body">
            <aside className="pbp__list reveal-stagger" ref={refGrid}>
              {visible.map((p) => {
                const up = p.change >= 0;
                return (
                  <button
                    key={p.id}
                    className={`pbp__row ${active.id === p.id ? "is-active" : ""}`}
                    onClick={() => setActive(p)}
                  >
                    <div className="pbp__row-main">
                      <span className="pbp__row-cat mono">{p.category}</span>
                      <span className="pbp__row-name">{p.name}</span>
                    </div>
                    <div className="pbp__row-price tabular">
                      <strong>{p.avg.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                      <span className="mono">{p.unit}</span>
                    </div>
                    <div className="pbp__row-spark">
                      <Sparkline
                        data={p.series}
                        width={120}
                        height={32}
                        color={up ? "#7fdca0" : "#ef6b6b"}
                        fillColor={up ? "rgba(127,220,160,0.18)" : "rgba(239,107,107,0.18)"}
                        strokeWidth={1.4}
                      />
                    </div>
                    <div className={`pbp__row-chg mono ${up ? "is-up" : "is-down"}`}>
                      {up ? "▲" : "▼"} {Math.abs(p.change).toFixed(1)}%
                    </div>
                  </button>
                );
              })}
            </aside>

            <article className="pbp__detail">
              <header className="pbp__detail-head">
                <div>
                  <span className="mono pbp__detail-cat">{active.category}</span>
                  <h3>{active.name}</h3>
                  <span className="mono pbp__detail-time">{active.updated}</span>
                </div>
                <div className="pbp__detail-price">
                  <strong className="tabular">
                    {active.avg.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                  </strong>
                  <span className="mono">{active.unit}</span>
                  <em className={`mono ${active.change >= 0 ? "text-green" : "text-red"}`}>
                    {active.change >= 0 ? "▲" : "▼"} {Math.abs(active.change).toFixed(2)}%
                  </em>
                </div>
              </header>

              <div className="pbp__detail-stats">
                <div>
                  <span className="mono">Ortalama Fiyat</span>
                  <strong className="tabular">{active.avg.toFixed(2)}</strong>
                </div>
                <div>
                  <span className="mono">En Düşük</span>
                  <strong className="tabular">{active.low.toFixed(2)}</strong>
                </div>
                <div>
                  <span className="mono">En Yüksek</span>
                  <strong className="tabular">{active.high.toFixed(2)}</strong>
                </div>
                <div>
                  <span className="mono">Günlük Değişim</span>
                  <strong className={`tabular ${active.change >= 0 ? "text-green" : "text-red"}`}>
                    {active.change >= 0 ? "+" : ""}
                    {active.change.toFixed(2)}%
                  </strong>
                </div>
                <div>
                  <span className="mono">İşlem Hacmi</span>
                  <strong className="tabular">{active.volume}</strong>
                </div>
                <div>
                  <span className="mono">Son Güncelleme</span>
                  <strong className="tabular">{active.updated}</strong>
                </div>
              </div>

              <div className="pbp__detail-chart">
                <div className="pbp__chart-grid" aria-hidden>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span key={i} />
                  ))}
                </div>
                <Sparkline
                  data={active.series}
                  width={780}
                  height={220}
                  color="#258a4a"
                  fillColor="rgba(47,165,90,0.16)"
                  strokeWidth={2}
                />
                <div className="pbp__chart-x mono">
                  <span>03 May</span>
                  <span>06 May</span>
                  <span>09 May</span>
                  <span>12 May</span>
                </div>
              </div>

              <footer className="pbp__detail-foot">
                <div className="pbp__detail-tags">
                  <span className="mono">Tescilli</span>
                  <span className="mono">{range}</span>
                  <span className="mono">{active.category}</span>
                </div>
                <div className="pbp__detail-actions">
                  <a className="btn-link" href="/fiyat-bulteni">Geçmiş Verilere Git</a>
                  <a className="btn btn-ghost" href="#">Bültene Abone Ol</a>
                </div>
              </footer>
            </article>
          </div>
        </div>
      </div>
    </section>
  );
}
