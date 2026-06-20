import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import {
  useAnnouncements,
  useCorporate,
  useCurrentPrices,
  useNewsList,
  usePublicServiceAgreements,
} from "../hooks/usePublicApi";
import { prefetchPriceBulletin } from "../lib/prefetchBulletin";
import { compareByCountDesc } from "../lib/bulletinFilters";
import { formatDisplayHeading } from "../lib/formatDisplayHeading";
import {
  changeDirection,
  formatChangePct,
  formatPrice,
  hasChangePct,
} from "../lib/priceDisplay";
import Sparkline from "./Sparkline";
import { useReveal } from "../hooks/useReveal";
import "./HomeSections.css";

export function HomePriceSummary() {
  const queryClient = useQueryClient();
  const head = useReveal<HTMLDivElement>();
  const grid = useReveal<HTMLDivElement>();
  const { data: priceData } = useCurrentPrices();
  // İşlem adedine göre en yüksek 4 ürün.
  const preview = useMemo(() => {
    const rows = [...(priceData ?? [])];
    rows.sort(compareByCountDesc);
    return rows.slice(0, 4);
  }, [priceData]);

  return (
    <section className="hsec hsec-price">
      <div className="container">
        <div className="hsec-price__head section-title reveal" ref={head}>
          <div>
            <span className="eyebrow">Ana Özet · Tescilli Fiyatlar</span>
            <h2>
              Güncel fiyatların <em className="hsec-price__em">hızlı görünümü</em>
            </h2>
          </div>
          <p>Kısa süreli piyasa izleme için seçili ürünler. Tam panel, tarih aralığı ve grafik özeti için fiyat bültenine geçin.</p>
          <Link
            className="btn btn-primary hsec-price__cta"
            to="/fiyat-bulteni"
            onMouseEnter={() => prefetchPriceBulletin(queryClient)}
          >
            Tam bültene git
          </Link>
        </div>

        <div className="hsec-price__grid reveal" ref={grid}>
          {preview.map((p) => {
            const dir = changeDirection(p.change_pct);
            const down = dir === "down";
            return (
              <article className="hsec-price__card card" key={p.product_slug}>
                <div className="hsec-price__card-top">
                  <div>
                    <h3>{p.product_name}</h3>
                    <span className="hsec-price__meta mono">{p.product_category}</span>
                  </div>
                  <span
                    className={`hsec-price__chg mono ${
                      hasChangePct(p.change_pct)
                        ? dir === "up"
                          ? "is-up"
                          : "is-down"
                        : ""
                    }`}
                  >
                    {formatChangePct(p.change_pct)}
                  </span>
                </div>
                <div className="hsec-price__mid mono">
                  <span className="hsec-price__avg">{formatPrice(p.avg_price)}</span>
                  <span className="hsec-price__unit">{p.product_unit}</span>
                </div>
                <div className="hsec-price__spark">
                  <Sparkline
                    data={p.sparkline_series ?? []}
                    width={280}
                    height={48}
                    color={down ? "var(--c-red-500)" : "var(--c-green-600)"}
                  />
                </div>
                <div className="hsec-price__foot mono">
                  <span>Düşük {formatPrice(p.low_price)}</span>
                  <span>Yüksek {formatPrice(p.high_price)}</span>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function HomeNewsAnnouncementsBand() {
  const headRef = useReveal<HTMLDivElement>();
  const gridRef = useReveal<HTMLDivElement>();
  const { data: newsData } = useNewsList(4);
  const { data: annData } = useAnnouncements(6);
  const topNews = (newsData ?? []).slice(0, 2);
  const ann = (annData ?? []).slice(0, 4);

  return (
    <section className="hsec hsec-dual">
      <div className="container">
        <div className="hsec-dual__head section-title reveal" ref={headRef}>
          <div>
            <span className="eyebrow">Gündem · Kurumsal Akış</span>
            <h2>
              Son haberler ve <em className="hsec-dual__em">duyurular</em>
            </h2>
          </div>
          <p>Borsa gündemini özetleyen haber başlıkları ve üyelere yönelik güncel duyuru satırları.</p>
        </div>

        <div className="hsec-dual__grid reveal" ref={gridRef}>
          <div className="hsec-dual__col hsec-dual__col--news card">
            <div className="hsec-dual__col-head">
              <span className="mono hsec-dual__label">Haberler</span>
              <Link className="btn-link" to="/haberler">
                Tüm haberleri gör
              </Link>
            </div>
            <ul className="hsec-dual__news-list">
              {topNews.map((n) => (
                <li key={n.id}>
                  <Link to="/haberler" className="hsec-dual__news-link">
                    <span className={`hsec-dual__chip hsec-dual__chip--${String(n.tone)}`}>{n.category}</span>
                    <span className="hsec-dual__news-title">{n.title}</span>
                    <span className="hsec-dual__news-date mono">
                      {n.publishedAt ? new Date(n.publishedAt).toLocaleDateString("tr-TR", { day: "numeric", month: "short" }) : ""}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="hsec-dual__col hsec-dual__col--ann card">
            <div className="hsec-dual__col-head">
              <span className="mono hsec-dual__label">Duyurular</span>
              <Link className="btn-link" to="/duyurular">
                Duyuru merkezi
              </Link>
            </div>
            <ul className="hsec-dual__ann-list">
              {ann.map((a) => (
                <li key={a.id} className="mono">
                  <span className="hsec-dual__ann-dot" aria-hidden />
                  <span>{a.title}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

const AGREEMENT_CATEGORY_LABELS: Record<string, string> = {
  akaryakit: "Akaryakıt",
  kargo: "Kargo & Lojistik",
  giyim: "İş Giyimi",
  optik: "Optik",
};

const AgreementIcon = ({ category }: { category: string }) => {
  const props = { width: 22, height: 22, viewBox: "0 0 24 24", fill: "none" } as const;
  const stroke = "currentColor";
  switch (category) {
    case "akaryakit":
      return (
        <svg {...props}>
          <path d="M6 20V8l4-3v15M14 20V4h4l2 3v13" stroke={stroke} strokeWidth="1.4" strokeLinejoin="round" />
        </svg>
      );
    case "kargo":
      return (
        <svg {...props}>
          <path
            d="M3 8h11v8H3zM14 10h4l3 3v3h-7zM7 18a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm10 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"
            stroke={stroke}
            strokeWidth="1.4"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "giyim":
      return (
        <svg {...props}>
          <path d="M12 3 7 7v14h10V7l-5-4Z" stroke={stroke} strokeWidth="1.4" strokeLinejoin="round" />
        </svg>
      );
    case "optik":
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="8" stroke={stroke} strokeWidth="1.4" />
          <path d="M4 12h16M12 4c2 3 2 13 0 16M12 4c-2 3-2 13 0 16" stroke={stroke} strokeWidth="1.4" />
        </svg>
      );
    default:
      return (
        <svg {...props}>
          <path d="M8 12l3 3 5-6" stroke={stroke} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="12" cy="12" r="9" stroke={stroke} strokeWidth="1.4" />
        </svg>
      );
  }
};

export function HomeServicesShortcuts() {
  const headRef = useReveal<HTMLDivElement>();
  const gridRef = useReveal<HTMLDivElement>();
  const { data: agreements } = usePublicServiceAgreements();
  const slice = (agreements ?? []).slice(0, 6);

  return (
    <section className="hsec hsec-svc">
      <div className="container">
        <div className="hsec-svc__head section-title reveal" ref={headRef}>
          <div>
            <span className="eyebrow">Üye · Avantajlar</span>
            <h2>
              Anlaşma<em className="hsec-svc__em">larımız</em>
            </h2>
          </div>
          <p>Borsamızın imzaladığı protokoller kapsamında üyelerimiz akaryakıt, kargo, iş giyimi ve optik hizmetlerinde indirimli fiyatlardan yararlanır.</p>
          <Link className="btn btn-ghost hsec-svc__cta" to="/hizmetler#anlasmalarimiz">
            Tüm anlaşmaları aç
          </Link>
        </div>

        <div className="hsec-svc__grid reveal" ref={gridRef}>
          {slice.map((a) => (
            <Link key={a.id} to={`/hizmetler/anlasmalar/${a.slug}`} className="hsec-svc__tile card">
              <span className="hsec-svc__icon">
                <AgreementIcon category={a.category} />
              </span>
              <div>
                <span className="mono hsec-svc__tile-cat">
                  {AGREEMENT_CATEGORY_LABELS[a.category] ?? "Anlaşma"}
                </span>
                <h3>{a.title}</h3>
                <p>{a.summary}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export function HomeRegionalNetworkCta() {
  const ref = useReveal<HTMLDivElement>();

  return (
    <section className="hsec hsec-region">
      <div className="container">
        <div className="hsec-region__card reveal" ref={ref}>
          <div className="hsec-region__visual" aria-hidden>
            <img src="/erzurum-map.png" alt="" className="hsec-region__map" loading="lazy" decoding="async" />
            <div className="hsec-region__veil" />
            <span className="hsec-region__node n1" />
            <span className="hsec-region__node n2" />
            <span className="hsec-region__node n3" />
            <svg className="hsec-region__lines" viewBox="0 0 400 240" preserveAspectRatio="none">
              <path d="M60 170 L200 118 L340 154" fill="none" stroke="rgba(124,217,154,0.45)" strokeWidth="1.2" />
              <circle cx="200" cy="118" r="4" fill="rgba(124,217,154,0.9)" />
            </svg>
          </div>

          <div className="hsec-region__body">
            <span className="eyebrow">Bölgesel Veri · Harita Katmanı</span>
            <h2 className="hsec-region__title">
              Bölgesel ticaret <em>ağına</em> geçin
            </h2>
            <p>Erzurum ve bağlantılı hatlarda canlı kurlar, ürün özetleri ve harita üzerinde ilçe odaklı veri noktaları tek ekranda.</p>
            <div className="hsec-region__actions">
              <Link className="btn btn-primary" to="/piyasa-verileri">
                Piyasa verilerini aç
              </Link>
              <Link className="btn btn-ghost" to="/fiyat-bulteni">
                Fiyat bülteni
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function HomeCorporateCta() {
  const ref = useReveal<HTMLDivElement>();
  const { data, isLoading, isError } = useCorporate();
  const profile = data?.profile;
  const { lead: headingLead, emphasis: headingEmphasis } = formatDisplayHeading(profile?.heading);

  const intro = isLoading
    ? "Kurumsal içerik yükleniyor…"
    : isError
      ? "Misyon, vizyon ve tarihçe — kurumsal sayfada ayrıntılı bilgi."
      : profile?.lead ??
        "Misyon, vizyon, tarihçe ve bölgesel ekonomiye katkı — kurumsal kimlik ve yönetişim çerçevesi ayrı sayfada ayrıntılı sunulur.";

  return (
    <section className="hsec hsec-corp">
      <div className="container">
        <div className="hsec-corp__band card reveal" ref={ref}>
          <div className="hsec-corp__text">
            <span className="eyebrow">{profile?.eyebrow ?? "Kurumsal · 1946'dan Beri"}</span>
            <h2>
              {headingEmphasis ? (
                <>
                  {headingLead} ile <em>tanışın</em>
                </>
              ) : (
                <>{headingLead} ile tanışın</>
              )}
            </h2>
            <p>{intro}</p>
          </div>
          <div className="hsec-corp__actions">
            <Link className="btn btn-primary" to="/kurumsal">
              Kurumsal bilgi al
            </Link>
            <Link className="btn btn-ghost" to="/iletisim">
              İletişim
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
