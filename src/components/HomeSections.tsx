import { Link } from "react-router-dom";
import { announcements, news, products, services } from "../data/market";
import Sparkline from "./Sparkline";
import { useReveal } from "../hooks/useReveal";
import "./HomeSections.css";

const ServiceIcon = ({ name }: { name: string }) => {
  const props = { width: 22, height: 22, viewBox: "0 0 24 24", fill: "none" } as const;
  const stroke = "currentColor";
  switch (name) {
    case "user":
      return (
        <svg {...props}>
          <circle cx="12" cy="8" r="4" stroke={stroke} strokeWidth="1.4" />
          <path d="M4 21c1-4 4.5-6 8-6s7 2 8 6" stroke={stroke} strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      );
    case "stamp":
      return (
        <svg {...props}>
          <path
            d="M8 4l1 4h6l1-4M6 10h12v3a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4v-3zM4 21h16"
            stroke={stroke}
            strokeWidth="1.4"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "flask":
      return (
        <svg {...props}>
          <path d="M9 3h6M10 3v6L4 19a2 2 0 0 0 1.7 3h12.6A2 2 0 0 0 20 19l-6-10V3" stroke={stroke} strokeWidth="1.4" strokeLinejoin="round" />
        </svg>
      );
    case "doc":
      return (
        <svg {...props}>
          <path d="M7 3h8l4 4v14H7z" stroke={stroke} strokeWidth="1.4" strokeLinejoin="round" />
          <path d="M15 3v4h4M9 12h6M9 16h6" stroke={stroke} strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      );
    case "spark":
      return (
        <svg {...props}>
          <path d="M12 3l2.4 5.6L20 11l-5.6 2.4L12 19l-2.4-5.6L4 11l5.6-2.4z" stroke={stroke} strokeWidth="1.4" strokeLinejoin="round" />
        </svg>
      );
    case "book":
      return (
        <svg {...props}>
          <path d="M5 4h10a4 4 0 0 1 4 4v12H9a4 4 0 0 1-4-4V4z" stroke={stroke} strokeWidth="1.4" strokeLinejoin="round" />
          <path d="M5 16h14" stroke={stroke} strokeWidth="1.4" />
        </svg>
      );
    default:
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="9" stroke={stroke} strokeWidth="1.4" />
        </svg>
      );
  }
};

export function HomePriceSummary() {
  const head = useReveal<HTMLDivElement>();
  const grid = useReveal<HTMLDivElement>();
  const preview = products.slice(0, 4);

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
          <Link className="btn btn-primary hsec-price__cta" to="/fiyat-bulteni">
            Tam bültene git
          </Link>
        </div>

        <div className="hsec-price__grid reveal" ref={grid}>
          {preview.map((p) => {
            const up = p.change >= 0;
            return (
              <article className="hsec-price__card card" key={p.id}>
                <div className="hsec-price__card-top">
                  <div>
                    <h3>{p.name}</h3>
                    <span className="hsec-price__meta mono">{p.category}</span>
                  </div>
                  <span className={`hsec-price__chg mono ${up ? "is-up" : "is-down"}`}>
                    {up ? "+" : ""}
                    {p.change}%
                  </span>
                </div>
                <div className="hsec-price__mid mono">
                  <span className="hsec-price__avg">{p.avg.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</span>
                  <span className="hsec-price__unit">{p.unit}</span>
                </div>
                <div className="hsec-price__spark">
                  <Sparkline data={p.series} width={280} height={48} color={up ? "var(--c-green-600)" : "var(--c-red-500)"} />
                </div>
                <div className="hsec-price__foot mono">
                  <span>Düşük {p.low}</span>
                  <span>Yüksek {p.high}</span>
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
  const topNews = news.slice(0, 2);
  const ann = announcements.slice(0, 4);

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
                    <span className="hsec-dual__news-date mono">{n.date}</span>
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
              {ann.map((a, i) => (
                <li key={i} className="mono">
                  <span className="hsec-dual__ann-dot" aria-hidden />
                  <span>{a}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

export function HomeServicesShortcuts() {
  const headRef = useReveal<HTMLDivElement>();
  const gridRef = useReveal<HTMLDivElement>();
  const slice = services.slice(0, 6);

  return (
    <section className="hsec hsec-svc">
      <div className="container">
        <div className="hsec-svc__head section-title reveal" ref={headRef}>
          <div>
            <span className="eyebrow">Üye · Hızlı Erişim</span>
            <h2>
              Kurumsal hizmet <em className="hsec-svc__em">kısayolları</em>
            </h2>
          </div>
          <p>En sık kullanılan işlemler için tek tıkla hizmet sayfasına yönlendirme. Tüm hizmet kalemleri detaylı açıklamalarla listelenir.</p>
          <Link className="btn btn-ghost hsec-svc__cta" to="/hizmetler">
            Tüm hizmetleri aç
          </Link>
        </div>

        <div className="hsec-svc__grid reveal" ref={gridRef}>
          {slice.map((s) => (
            <Link key={s.id} to="/hizmetler" className="hsec-svc__tile card">
              <span className="hsec-svc__icon">
                <ServiceIcon name={s.icon} />
              </span>
              <div>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
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

  return (
    <section className="hsec hsec-corp">
      <div className="container">
        <div className="hsec-corp__band card reveal" ref={ref}>
          <div className="hsec-corp__text">
            <span className="eyebrow">Kurumsal · 1946&apos;dan Beri</span>
            <h2>Erzurum Ticaret Borsası ile tanışın</h2>
            <p>Misyon, vizyon, tarihçe ve bölgesel ekonomiye katkı — kurumsal kimlik ve yönetişim çerçevesi ayrı sayfada ayrıntılı sunulur.</p>
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
