import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useCurrentPrices,
  usePriceBulletin,
  usePriceHistoryWithFallback,
} from "../hooks/usePublicApi";
import type { CurrentPriceRow } from "../lib/publicApi";
import { fetchPriceHistoryWithFallback } from "../lib/publicApi";
import { formatChartDate, formatLongDate } from "../lib/formatLocalDate";
import {
  changeDirection,
  formatChangePct,
  formatInteger,
  formatMoney,
  formatPrice,
  formatVolume,
  hasChangePct,
  saleTypeFromProductName,
} from "../lib/priceDisplay";
import { PRICE_RANGE_LABELS, RANGE_TO_PERIOD, type PriceRangeLabel } from "../lib/priceRanges";
import type { PriceHistoryPeriod } from "../lib/publicApi";
import Sparkline from "./Sparkline";
import BulletinFilterBar from "./BulletinFilterBar";
import { useReveal } from "../hooks/useReveal";
import {
  applyBulletinFilters,
  DEFAULT_BULLETIN_FILTERS,
  extractCategories,
  extractSaleTypes,
  type BulletinFilterState,
} from "../lib/bulletinFilters";
import "./PriceBulletinPanel.css";

const PriceHistoryChart = lazy(() => import("./PriceHistoryChart"));

const PERIOD_NOTE_LABELS: Record<PriceHistoryPeriod, string> = {
  "7d": "son 7 gün",
  "30d": "son 30 gün",
  "90d": "son 90 gün",
  "365d": "son 1 yıl",
};

function formatUpdated(p: CurrentPriceRow): string {
  if (!p.entry_date) return "—";
  const d = formatChartDate(p.entry_date);
  return p.session_time ? `${d} · ${p.session_time}` : d;
}

function scheduleDeferredSparklines(onReady: () => void): void {
  if (typeof requestIdleCallback === "function") {
    requestIdleCallback(() => onReady(), { timeout: 400 });
    return;
  }
  requestAnimationFrame(() => onReady());
}

export default function PriceBulletinPanel({ bulletinPage = false }: { bulletinPage?: boolean }) {
  const queryClient = useQueryClient();
  const [range, setRange] = useState<PriceRangeLabel>("Günlük");
  const [filters, setFilters] = useState<BulletinFilterState>(DEFAULT_BULLETIN_FILTERS);
  const [activeSlug, setActiveSlug] = useState<string | null>(null);
  const [showSparklines, setShowSparklines] = useState(false);

  const refHead = useReveal<HTMLDivElement>();
  const refGrid = useReveal<HTMLDivElement>();

  const currentQ = useCurrentPrices({ enabled: !bulletinPage });
  const bulletinQ = usePriceBulletin(bulletinPage);
  const priceSource = bulletinPage ? bulletinQ : currentQ;
  const isLoading = priceSource.isLoading;
  const sessionDate = bulletinPage ? bulletinQ.data?.sessionDate : null;
  const period = RANGE_TO_PERIOD[range];

  const products = useMemo(() => {
    if (bulletinPage) return bulletinQ.data?.rows ?? [];
    return currentQ.data ?? [];
  }, [bulletinPage, bulletinQ.data?.rows, currentQ.data]);

  const categories = useMemo(() => extractCategories(products), [products]);
  const saleTypes = useMemo(() => extractSaleTypes(products), [products]);

  const visible = useMemo(() => {
    if (!bulletinPage) {
      return products.filter(
        (p) =>
          filters.category === "Tümü" || p.product_category === filters.category,
      );
    }
    return applyBulletinFilters(products, filters);
  }, [bulletinPage, products, filters]);

  const active: CurrentPriceRow | undefined =
    visible.find((p) => p.product_slug === activeSlug) ?? visible[0];

  const historyQ = usePriceHistoryWithFallback(active?.product_slug, period);
  const historyPoints = historyQ.data?.points ?? [];
  const effectivePeriod = historyQ.data?.effectivePeriod;
  const widenedNote =
    effectivePeriod && effectivePeriod !== period
      ? `Seçilen dönemde yeterli işlem yok — ${PERIOD_NOTE_LABELS[effectivePeriod]} gösteriliyor.`
      : null;

  useEffect(() => {
    if (!bulletinPage) return;
    setShowSparklines(false);
    if (!bulletinQ.isSuccess) return;
    scheduleDeferredSparklines(() => setShowSparklines(true));
  }, [bulletinPage, bulletinQ.isSuccess, bulletinQ.dataUpdatedAt]);

  useEffect(() => {
    if (!bulletinPage || !bulletinQ.isSuccess || visible.length === 0) return;
    const slug = visible[0]!.product_slug;
    const defaultPeriod = RANGE_TO_PERIOD["Günlük"];
    void queryClient.prefetchQuery({
      queryKey: ["public", "prices", "history-fb", slug, defaultPeriod],
      queryFn: () => fetchPriceHistoryWithFallback(slug, defaultPeriod),
      staleTime: 60_000,
    });
  }, [bulletinPage, bulletinQ.isSuccess, bulletinQ.dataUpdatedAt, visible, queryClient]);

  useEffect(() => {
    if (!visible.length) {
      if (activeSlug != null) setActiveSlug(null);
      return;
    }
    if (!activeSlug || !visible.some((p) => p.product_slug === activeSlug)) {
      setActiveSlug(visible[0].product_slug);
    }
  }, [visible, activeSlug]);

  const entryDateNote =
    bulletinPage &&
    sessionDate &&
    active?.entry_date &&
    active.entry_date !== sessionDate
      ? `Son işlem: ${formatChartDate(active.entry_date)}`
      : null;

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
              {PRICE_RANGE_LABELS.map((r) => (
                <button
                  key={r}
                  type="button"
                  className={`pbp__tab ${range === r ? "is-active" : ""}`}
                  onClick={() => setRange(r)}
                >
                  {r}
                </button>
              ))}
            </div>
            <div className="pbp__date mono">
              <span>
                {sessionDate
                  ? formatLongDate(sessionDate)
                  : active?.entry_date
                    ? formatLongDate(active.entry_date)
                    : "—"}
              </span>
              <span className="pbp__pulse" />
            </div>
          </div>

          {bulletinPage ? (
            <BulletinFilterBar
              filters={filters}
              onChange={(patch) => setFilters((prev) => ({ ...prev, ...patch }))}
              categories={categories}
              saleTypes={saleTypes}
              resultCount={visible.length}
              totalCount={products.length}
            />
          ) : (
            <div className="pbp__toolbar pbp__toolbar--compact">
              <div className="pbp__filters">
                {categories.map((f) => (
                  <button
                    key={f}
                    type="button"
                    className={`pbp__chip ${filters.category === f ? "is-active" : ""}`}
                    onClick={() => setFilters((prev) => ({ ...prev, category: f }))}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="pbp__body">
            {!isLoading && products.length === 0 ? (
              <p className="pbp__empty mono">
                Fiyat bülteni henüz yayımlanmadı. Güncel kotasyonlar, resmi seansların ardından bu sayfada
                listelenecektir.
              </p>
            ) : null}
            {!isLoading && products.length > 0 && visible.length === 0 ? (
              <p className="pbp__empty mono">
                Seçili filtrelere uygun ürün bulunamadı. Arama veya hacim filtrelerini gevşetmeyi deneyin.
              </p>
            ) : null}
            <aside className="pbp__list reveal-stagger" ref={refGrid}>
              {isLoading && (
                <div className="pbp__row" style={{ opacity: 0.5, pointerEvents: "none" }}>
                  <span className="mono" style={{ padding: "1rem" }}>Yükleniyor…</span>
                </div>
              )}
              {visible.map((p) => {
                const dir = changeDirection(p.change_pct);
                const up = dir === "up";
                const down = dir === "down";
                const sparkData = p.sparkline_series ?? [];
                return (
                  <button
                    key={p.product_slug}
                    type="button"
                    className={`pbp__row ${active?.product_slug === p.product_slug ? "is-active" : ""}`}
                    onClick={() => setActiveSlug(p.product_slug)}
                  >
                    <div className="pbp__row-main">
                      <span className="pbp__row-cat mono">{p.product_category}</span>
                      <span className="pbp__row-name">{p.product_name}</span>
                      {bulletinPage && (p.volume != null || p.transaction_count != null) ? (
                        <span className="pbp__row-meta mono">
                          {p.volume != null ? formatVolume(p) : null}
                          {p.volume != null && p.transaction_count != null ? " · " : null}
                          {p.transaction_count != null
                            ? `${formatInteger(p.transaction_count)} işlem`
                            : null}
                        </span>
                      ) : null}
                    </div>
                    <div className="pbp__row-price tabular">
                      <strong>{formatPrice(p.avg_price)}</strong>
                      <span className="mono">{p.product_unit}</span>
                    </div>
                    <div className="pbp__row-spark">
                      {showSparklines && sparkData.length > 0 ? (
                        <Sparkline
                          data={sparkData}
                          width={120}
                          height={32}
                          color={down ? "#ef6b6b" : "#7fdca0"}
                          fillColor={down ? "rgba(239,107,107,0.18)" : "rgba(127,220,160,0.18)"}
                          strokeWidth={1.4}
                          animate={false}
                        />
                      ) : (
                        <span className="pbp__row-spark-placeholder" aria-hidden />
                      )}
                    </div>
                    {hasChangePct(p.change_pct) ? (
                      <div className={`pbp__row-chg mono ${up ? "is-up" : "is-down"}`}>
                        {up ? "▲" : "▼"} {formatChangePct(p.change_pct).replace(/^\+/, "")}
                      </div>
                    ) : (
                      <div className="pbp__row-chg mono pbp__row-chg--na">—</div>
                    )}
                  </button>
                );
              })}
            </aside>

            {active && (
              <article className="pbp__detail">
                <header className="pbp__detail-head">
                  <div>
                    <span className="mono pbp__detail-cat">{active.product_category}</span>
                    <h3>{active.product_name}</h3>
                    <span className="mono pbp__detail-time">{formatUpdated(active)}</span>
                    {entryDateNote ? (
                      <span className="mono pbp__detail-time pbp__detail-time--note">{entryDateNote}</span>
                    ) : null}
                  </div>
                  <div className="pbp__detail-price">
                    <strong className="tabular">{formatPrice(active.avg_price)}</strong>
                    <span className="mono">{active.product_unit}</span>
                    {hasChangePct(active.change_pct) ? (
                      <em
                        className={`mono ${
                          changeDirection(active.change_pct) === "up"
                            ? "text-green"
                            : "text-red"
                        }`}
                      >
                        {changeDirection(active.change_pct) === "up" ? "▲" : "▼"}{" "}
                        {formatChangePct(active.change_pct)}
                      </em>
                    ) : null}
                  </div>
                </header>

                <div className="pbp__detail-stats">
                  <div>
                    <span className="mono">Ortalama Fiyat</span>
                    <strong className="tabular">{formatPrice(active.avg_price)}</strong>
                  </div>
                  <div>
                    <span className="mono">En Düşük</span>
                    <strong className="tabular">{formatPrice(active.low_price)}</strong>
                  </div>
                  <div>
                    <span className="mono">En Yüksek</span>
                    <strong className="tabular">{formatPrice(active.high_price)}</strong>
                  </div>
                  <div>
                    <span className="mono">Günlük Değişim</span>
                    <strong
                      className={`tabular ${
                        hasChangePct(active.change_pct)
                          ? changeDirection(active.change_pct) === "up"
                            ? "text-green"
                            : "text-red"
                          : ""
                      }`}
                    >
                      {formatChangePct(active.change_pct)}
                    </strong>
                  </div>
                  <div>
                    <span className="mono">İşlem Miktarı</span>
                    <strong className="tabular">{formatVolume(active)}</strong>
                  </div>
                  <div>
                    <span className="mono">İşlem Tutarı</span>
                    <strong className="tabular">
                      {formatMoney(active.transaction_amount)}
                      {active.transaction_amount != null ? " ₺" : ""}
                    </strong>
                  </div>
                  <div>
                    <span className="mono">Satış Şekli</span>
                    <strong className="tabular">
                      {saleTypeFromProductName(active.product_name) ?? "—"}
                    </strong>
                  </div>
                  <div>
                    <span className="mono">İşlem Adedi</span>
                    <strong className="tabular">{formatInteger(active.transaction_count)}</strong>
                  </div>
                  <div>
                    <span className="mono">Son Güncelleme</span>
                    <strong className="tabular">{formatUpdated(active)}</strong>
                  </div>
                </div>

                <div className="pbp__detail-chart">
                  {widenedNote ? (
                    <p className="pbp__chart-note mono">{widenedNote}</p>
                  ) : null}
                  <Suspense
                    fallback={
                      <div className="pbp__chart-loading mono" aria-busy="true">
                        Grafik yükleniyor…
                      </div>
                    }
                  >
                    <PriceHistoryChart
                      data={historyPoints}
                      loading={historyQ.isLoading}
                      error={historyQ.isError}
                      unit={active.product_unit}
                    />
                  </Suspense>
                </div>

                <footer className="pbp__detail-foot">
                  <div className="pbp__detail-tags">
                    <span className="mono">Tescilli</span>
                    <span className="mono">{range}</span>
                    <span className="mono">{active.product_category}</span>
                  </div>
                  <div className="pbp__detail-actions">
                    <a className="btn-link" href="/fiyat-bulteni">Geçmiş Verilere Git</a>
                    <a className="btn btn-ghost" href="#">Bültene Abone Ol</a>
                  </div>
                </footer>
              </article>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
