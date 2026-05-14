import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import "./Footer.css";

const NEWSLETTER_FREQUENCIES = ["Günlük", "Haftalık", "Aylık"] as const;

function MountainSilhouette() {
  return (
    <svg className="footer__mountain" viewBox="0 0 900 120" preserveAspectRatio="xMidYMid slice" aria-hidden>
      <defs>
        <linearGradient id="footer-mt-grad" x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="rgba(255,255,255,0)" />
          <stop offset="100%" stopColor="rgba(124,220,160,0.06)" />
        </linearGradient>
      </defs>
      <path
        fill="url(#footer-mt-grad)"
        d="M0 120 L140 68 L220 95 L320 42 L450 88 L580 35 L700 78 L820 55 L900 92 L900 120 Z"
        opacity="0.85"
      />
      <path
        fill="none"
        stroke="rgba(124,220,160,0.09)"
        strokeWidth="1"
        d="M0 118 L150 58 L240 90 L330 38 L460 84 L590 28 L710 72 L830 48 L900 118"
      />
    </svg>
  );
}

function WheatDivider() {
  return (
    <div className="footer__wheat-divider" aria-hidden>
      <svg viewBox="0 0 420 24" className="footer__wheat-svg">
        <path
          fill="none"
          stroke="rgba(200,181,108,0.35)"
          strokeWidth="0.8"
          d="M0 12h420M210 4v16M198 10c12-10 28-12 42 0 M180 14c36-22 96-26 162 22"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="210" cy="12" r="3" fill="rgba(200,181,108,0.25)" stroke="rgba(124,220,160,0.35)" strokeWidth="0.5" />
      </svg>
    </div>
  );
}

function IconLinkedIn({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" width="18" height="18" aria-hidden fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

function IconX({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" width="16" height="16" aria-hidden fill="none">
      <path d="M4 4l16 16M20 4L4 20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function IconYouTube({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" width="18" height="18" aria-hidden fill="currentColor">
      <path d="M21.58 8.24a2.73 2.73 0 00-1.92-1.93C18.06 6 12 6 12 6s-6.06 0-7.66.31A2.73 2.73 0 002.42 8.24 28.5 28.5 0 002.4 12a28.5 28.5 0 00.02 3.76 2.73 2.73 0 001.92 1.93C5.94 18 12 18 12 18s6.06 0 7.66-.31a2.73 2.73 0 001.92-1.93A28.39 28.39 0 0021.6 12c0-.9-.015-3.74-.02-3.76zm-9.93 7.61V10.17l5.06 2.84-5.06 2.84z" />
    </svg>
  );
}

function IconInstagram({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" width="18" height="18" aria-hidden fill="none">
      <rect x="3" y="3" width="18" height="18" rx="5" ry="5" stroke="currentColor" strokeWidth="1.35" />
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.35" />
      <circle cx="17.3" cy="6.8" r="1.35" fill="currentColor" stroke="none" />
    </svg>
  );
}

function IconCheck() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden className="footer__check-icon">
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M5 12l5 5L20 7"
      />
    </svg>
  );
}

function IconSun() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden className="footer__weather-icon">
      <circle cx="12" cy="12" r="4.5" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <path fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
    </svg>
  );
}

export default function Footer() {
  const footerRef = useRef<HTMLElement>(null);
  const clockRef = useRef<number | undefined>(undefined);
  const subTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const motionQuery = typeof window !== "undefined" ? window.matchMedia("(prefers-reduced-motion: reduce)") : null;

  const [now, setNow] = useState(() => new Date());
  const [newsletterFreq, setNewsletterFreq] = useState<(typeof NEWSLETTER_FREQUENCIES)[number]>("Günlük");
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    clockRef.current = window.setInterval(() => setNow(new Date()), 1000);
    return () => {
      if (clockRef.current) window.clearInterval(clockRef.current);
      if (subTimerRef.current) window.clearTimeout(subTimerRef.current);
    };
  }, []);

  const onFooterPointer = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      const el = footerRef.current;
      if (!el) return;
      if (motionQuery?.matches) return;
      const r = el.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width) * 100;
      const y = ((e.clientY - r.top) / r.height) * 100;
      el.style.setProperty("--footer-mx", `${x}%`);
      el.style.setProperty("--footer-my", `${y}%`);
    },
    [motionQuery]
  );

  const onSubscribe = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (subTimerRef.current) window.clearTimeout(subTimerRef.current);
    setSubscribed(true);
    subTimerRef.current = window.setTimeout(() => {
      setSubscribed(false);
      subTimerRef.current = undefined;
    }, 4500);
  };

  const timeStr = now.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const dateStr = now.toLocaleDateString("tr-TR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  const scrollTop = () => {
    const reduced = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
  };

  return (
    <footer ref={footerRef} className="footer" onPointerMove={onFooterPointer}>
      <div className="footer__glow" aria-hidden />

      <div className="container">
        <section className="footer__slogan" aria-labelledby="footer-slogan-heading">
          <MountainSilhouette />
          <div className="footer__slogan-inner">
            <div className="footer__slogan-text">
              <h2 id="footer-slogan-heading" className="footer__slogan-title">
                Doğu Anadolu&apos;nun ticaret <em>nabzını tutuyoruz.</em>
              </h2>
              <p className="footer__slogan-sign">1946&apos;dan beri</p>
            </div>
            <div className="footer__live-panel">
              <div className="footer__live-row">
                <span className="mono footer__live-label">Yerel saat</span>
                <time className="footer__live-time mono" dateTime={now.toISOString()}>
                  {timeStr}
                </time>
              </div>
              <p className="footer__live-date mono">{dateStr}</p>
              <div className="footer__live-row footer__live-row--split">
                <span className="mono footer__live-elev">Erzurum · 2.060 m</span>
                <span className="footer__weather">
                  <IconSun />
                  <span className="mono">18 °C · Açık</span>
                </span>
              </div>
            </div>
          </div>
        </section>
      </div>

      <WheatDivider />

      <div className="footer__map-band" aria-hidden>
        <div className="footer__map-inner">
          <img src="/erzurum-map.png" alt="" className="footer__map-img" loading="lazy" decoding="async" />
          <div className="footer__map-mask" />
          <span className="footer__map-node footer__map-node--1" />
          <span className="footer__map-node footer__map-node--2" />
          <span className="footer__map-node footer__map-node--3" />
          <span className="footer__map-node footer__map-node--4" />
        </div>
      </div>

      <WheatDivider />

      <div className="container">
        <div className="footer__grid">
          <div className="footer__col footer__col--brand">
            <div className="footer__brand-row">
              <img src="/erzurum-ticaret-borsasi-logo.png" alt="Erzurum Ticaret Borsası" width="56" height="56" />
              <div>
                <span className="footer__brand-name">Erzurum Ticaret Borsası</span>
                <span className="footer__brand-sub mono">Veri · Tescil · Güven</span>
              </div>
            </div>
            <p className="footer__brand-desc">
              Bölgenin üretim ve ticaret verisini şeffaf biçimde yayan, dijital altyapısı güçlü kurumsal borsa.
            </p>
            <div className="footer__cred">
              <img src="/akredite.png" alt="" width="40" height="40" />
              <span className="mono">TOBB Akredite Borsa · Kalite Yönetim Sistemi</span>
            </div>
          </div>

          <nav className="footer__col" aria-label="Keşfet">
            <span className="footer__col-title mono">Keşfet</span>
            <ul>
              <li>
                <Link to="/">Anasayfa</Link>
              </li>
              <li>
                <Link to="/kurumsal">Kurumsal</Link>
              </li>
              <li>
                <Link to="/piyasa-verileri">Piyasa Verileri</Link>
              </li>
              <li>
                <Link to="/fiyat-bulteni">Fiyat Bülteni</Link>
              </li>
            </ul>
          </nav>

          <nav className="footer__col" aria-label="İçerik">
            <span className="footer__col-title mono">İçerik</span>
            <ul>
              <li>
                <Link to="/haberler">Haberler</Link>
              </li>
              <li>
                <Link to="/duyurular">Duyurular</Link>
              </li>
              <li>
                <Link to="/raporlar">Raporlar</Link>
              </li>
            </ul>
          </nav>

          <nav className="footer__col" aria-label="Üye">
            <span className="footer__col-title mono">Üye</span>
            <ul>
              <li>
                <Link to="/hizmetler">Hizmetler</Link>
              </li>
              <li>
                <a href="#">Üye Girişi</a>
              </li>
              <li>
                <a href="#">Tescil Sorgu</a>
              </li>
              <li>
                <Link to="/hizmetler">Laboratuvar</Link>
              </li>
            </ul>
          </nav>

          <div className="footer__col footer__col--contact">
            <span className="footer__col-title mono">İletişim</span>
            <ul>
              <li>
                <span className="mono">Adres</span>
                Muratpaşa Mah. Cemal Gürsel Cad. No: 13
                <br />
                Yakutiye / Erzurum
              </li>
              <li>
                <span className="mono">Telefon</span>
                <a href="tel:+904422345678">+90 442 234 56 78</a>
              </li>
              <li>
                <span className="mono">E-posta</span>
                <a href="mailto:bilgi@etb.org.tr">bilgi@etb.org.tr</a>
              </li>
              <li>
                <span className="mono">Çalışma Saatleri</span>
                Pazartesi — Cuma · 08:30 — 17:30
              </li>
            </ul>
          </div>
        </div>

        <section className="footer__news-band" aria-labelledby="footer-news-heading">
          <div className="footer__news-band-inner">
            <div className="footer__news-intro">
              <h3 id="footer-news-heading" className="footer__news-title">
                e-Bültene katılın
              </h3>
              <p className="footer__news-copy">Güncel fiyat bültenleri ve duyurular doğrudan gelen kutunuza.</p>
              <div className="footer__chips" role="group" aria-label="Bülten sıklığı">
                {NEWSLETTER_FREQUENCIES.map((f) => (
                  <button
                    key={f}
                    type="button"
                    className={`footer__chip ${newsletterFreq === f ? "is-active" : ""}`}
                    onClick={() => setNewsletterFreq(f)}
                    aria-pressed={newsletterFreq === f}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
            <form className="footer__news-form" onSubmit={onSubscribe}>
              <label htmlFor="footer-email" className="visually-hidden">
                E-posta adresiniz
              </label>
              <input id="footer-email" name="email" type="email" required placeholder="E-posta adresiniz" autoComplete="email" />
              <button className="btn btn-primary" type="submit">
                Abone Ol
              </button>
            </form>
          </div>
          <div className={`footer__news-done ${subscribed ? "is-visible" : ""}`} role="status" aria-live="polite">
            <IconCheck />
            <span>Aboneliğiniz alındı · {newsletterFreq} özet</span>
          </div>
        </section>

        <div className="footer__trust">
          <div className="footer__social">
            <a href="#" className="footer__social-link" aria-label="LinkedIn">
              <IconLinkedIn />
            </a>
            <a href="#" className="footer__social-link" aria-label="X">
              <IconX />
            </a>
            <a href="#" className="footer__social-link" aria-label="YouTube">
              <IconYouTube />
            </a>
            <a href="#" className="footer__social-link" aria-label="Instagram">
              <IconInstagram />
            </a>
          </div>
          <ul className="footer__badges">
            <li className="footer__badge mono">TOBB Akredite</li>
            <li className="footer__badge mono">ISO 9001</li>
            <li className="footer__badge mono">ISO 27001</li>
            <li className="footer__badge mono">KVKK Uyumlu</li>
          </ul>
        </div>

        <div className="footer__meta">
          <div className="footer__meta-left">
            <span className="mono">
              © {new Date().getFullYear()} Erzurum Ticaret Borsası · Tüm hakları saklıdır.
            </span>
            <nav className="footer__legal" aria-label="Yasal">
              <Link to="/iletisim">KVKK Aydınlatma</Link>
              <span className="footer__legal-sep" aria-hidden>
                ·
              </span>
              <Link to="/iletisim">Gizlilik</Link>
              <span className="footer__legal-sep" aria-hidden>
                ·
              </span>
              <Link to="/iletisim">Çerez</Link>
              <span className="footer__legal-sep" aria-hidden>
                ·
              </span>
              <Link to="/iletisim">Erişilebilirlik</Link>
            </nav>
          </div>
          <div className="footer__meta-center mono">
            <span className="footer__pulse" aria-hidden />
            Sistem durumu: Çevrimiçi
          </div>
          <div className="footer__meta-right">
            <span className="mono footer__version">v2.0 · Son güncelleme 14 Mayıs 2026</span>
            <button type="button" className="footer__top-btn" onClick={scrollTop} aria-label="Yukarı çık">
              ↑
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
