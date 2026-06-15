import { useMemo, useState } from "react";
import { useExternalBulletins } from "../hooks/usePublicApi";
import type { ExternalBulletinRow, ExternalBulletinSource } from "../lib/publicApi";
import { formatLongDate } from "../lib/formatLocalDate";
import {
  formatInteger,
  formatMoney,
  formatPrice,
} from "../lib/priceDisplay";
import { useReveal } from "../hooks/useReveal";
import "./ExternalBulletinsPanel.css";

const CATEGORY_ALL = "Tümü";

function formatExternalVolume(row: ExternalBulletinRow): string {
  if (row.volume == null || !Number.isFinite(row.volume)) return "—";
  const unit = row.volumeUnit ? ` ${row.volumeUnit}` : "";
  return `${row.volume.toLocaleString("tr-TR")}${unit}`;
}

export default function ExternalBulletinsPanel() {
  const { data, isLoading, isError } = useExternalBulletins();
  const refHead = useReveal<HTMLDivElement>();
  const refTable = useReveal<HTMLDivElement>();

  const sources = data?.sources ?? [];
  const [activeSourceId, setActiveSourceId] = useState<string | null>(null);
  const [filter, setFilter] = useState(CATEGORY_ALL);

  const activeSource: ExternalBulletinSource | undefined =
    sources.find((s) => s.id === activeSourceId) ??
    sources.find((s) => s.status === "ok" && s.rows.length > 0) ??
    sources[0];

  const rows = activeSource?.rows ?? [];

  const categories = useMemo(
    () => [
      CATEGORY_ALL,
      ...Array.from(new Set(rows.map((r) => r.category).filter(Boolean))),
    ],
    [rows],
  );

  const visible = useMemo(
    () => (filter === CATEGORY_ALL ? rows : rows.filter((r) => r.category === filter)),
    [filter, rows],
  );

  if (!isLoading && !isError && sources.length === 0) return null;

  return (
    <section className="ebp">
      <div className="container">
        <div className="ebp__head reveal" ref={refHead}>
          <div>
            <span className="eyebrow">Bölgesel Borsalar · Referans</span>
            <h2>
              Diğer Borsa <em className="ebp__head-em">Fiyat Bültenleri</em>
            </h2>
            <p>
              Konya ve Kızıltepe ticaret borsalarının günlük salon satış bültenleri.
              Veriler ilgili borsaların resmi kaynaklarından alınır; referans amaçlıdır.
            </p>
          </div>
          {data?.sessionDate ? (
            <div className="ebp__date mono">
              <span>{formatLongDate(data.sessionDate)}</span>
            </div>
          ) : null}
        </div>

        <div className="ebp__shell">
          <div className="ebp__toolbar">
            <div className="ebp__tabs" role="tablist" aria-label="Borsa seçimi">
              {sources.map((source) => (
                <button
                  key={source.id}
                  type="button"
                  role="tab"
                  aria-selected={activeSource?.id === source.id}
                  className={`ebp__tab ${activeSource?.id === source.id ? "is-active" : ""}`}
                  onClick={() => {
                    setActiveSourceId(source.id);
                    setFilter(CATEGORY_ALL);
                  }}
                >
                  {source.shortName}
                </button>
              ))}
            </div>
            {activeSource?.sourceUrl ? (
              <a
                className="ebp__source-link mono"
                href={activeSource.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Kaynak site →
              </a>
            ) : null}
          </div>

          {categories.length > 1 ? (
            <div className="ebp__filters">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  className={`ebp__chip ${filter === cat ? "is-active" : ""}`}
                  onClick={() => setFilter(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          ) : null}

          <div className="ebp__body reveal-stagger" ref={refTable}>
            {isLoading ? (
              <p className="ebp__status mono">Bültenler yükleniyor…</p>
            ) : isError ? (
              <p className="ebp__status mono">Bültenler şu an alınamıyor.</p>
            ) : activeSource?.status === "error" ? (
              <p className="ebp__status mono">
                {activeSource.errorMessage ?? `${activeSource.name} bülteni alınamadı.`}
              </p>
            ) : visible.length === 0 ? (
              <p className="ebp__status mono">
                {activeSource?.name ?? "Seçili borsa"} için bugün bülten kaydı bulunamadı.
              </p>
            ) : (
              <div className="ebp__table-wrap">
                <table className="ebp__table">
                  <thead>
                    <tr>
                      <th>Ürün</th>
                      <th>En düşük</th>
                      <th>En yüksek</th>
                      <th>Ortalama</th>
                      <th>Miktar</th>
                      <th>İşlem</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visible.map((row, idx) => (
                      <tr key={`${row.productName}-${row.saleType ?? ""}-${idx}`}>
                        <td>
                          <span className="ebp__cat mono">{row.category}</span>
                          <span className="ebp__name">{row.productName}</span>
                          {row.saleType ? (
                            <span className="ebp__sale mono">{row.saleType}</span>
                          ) : null}
                        </td>
                        <td className="tabular">{formatPrice(row.lowPrice)}</td>
                        <td className="tabular">{formatPrice(row.highPrice)}</td>
                        <td className="tabular">
                          <strong>{formatPrice(row.avgPrice)}</strong>
                        </td>
                        <td className="tabular">{formatExternalVolume(row)}</td>
                        <td className="tabular">
                          {row.transactionCount != null
                            ? formatInteger(row.transactionCount)
                            : row.transactionAmount != null
                              ? formatMoney(row.transactionAmount)
                              : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
