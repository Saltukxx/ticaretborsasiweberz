import HeroMosaic from "./HeroMosaic";
import { useIdle } from "../hooks/useIdle";
import { useScramble } from "../hooks/useScramble";
import "./Hero.css";

const heroTitleLead = "Doğu Anadolu'nun";

export default function Hero() {
  const idle = useIdle(6000);
  const scrambledTitle = useScramble(heroTitleLead, 1600);

  return (
    <section className={`hero ${idle ? "hero--idle" : ""}`}>
      <div className="hero__bg" aria-hidden>
        <svg className="hero__grid-svg" viewBox="0 0 1600 900" preserveAspectRatio="none">
          <defs>
            <pattern id="gridp" width="80" height="80" patternUnits="userSpaceOnUse">
              <path d="M 80 0 L 0 0 0 80" fill="none" stroke="rgba(11,21,48,0.055)" strokeWidth="1" />
            </pattern>
            <radialGradient id="glow" cx="80%" cy="20%" r="60%">
              <stop offset="0%" stopColor="rgba(29,78,216,0.12)" />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>
            <radialGradient id="glow2" cx="10%" cy="80%" r="50%">
              <stop offset="0%" stopColor="rgba(47,165,90,0.12)" />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>
          </defs>
          <rect width="100%" height="100%" fill="url(#gridp)" />
          <rect width="100%" height="100%" fill="url(#glow)" />
          <rect width="100%" height="100%" fill="url(#glow2)" />

          {/* Palandöken stilize silüet */}
          <path
            d="M0,700 L120,640 L220,680 L340,600 L460,650 L580,560 L720,610 L840,540 L980,600 L1140,520 L1280,580 L1420,500 L1600,560 L1600,900 L0,900 Z"
            fill="rgba(232, 237, 229, 0.82)"
            stroke="rgba(11, 21, 48, 0.12)"
            strokeWidth="1"
          />
          <path
            d="M0,750 L160,700 L320,740 L480,680 L640,720 L800,660 L960,710 L1120,650 L1280,700 L1440,640 L1600,690 L1600,900 L0,900 Z"
            fill="rgba(214, 224, 213, 0.62)"
          />

          {/* Veri çizgileri */}
          <path
            className="hero__line hero__line--a"
            d="M0,420 C200,380 400,460 600,400 S1000,360 1200,420 1400,460 1600,400"
            fill="none"
            stroke="rgba(37,138,74,0.45)"
            strokeWidth="1.2"
          />
          <path
            className="hero__line hero__line--b"
            d="M0,500 C160,540 380,440 540,500 S900,540 1100,480 1380,500 1600,460"
            fill="none"
            stroke="rgba(26,58,134,0.28)"
            strokeWidth="1.2"
          />
          <path
            className="hero__line hero__line--c"
            d="M0,580 C220,540 420,620 620,560 S980,520 1180,580 1420,560 1600,540"
            fill="none"
            stroke="rgba(127,220,160,0.4)"
            strokeWidth="1"
          />
        </svg>

        <div className="hero__orb hero__orb--a" />
        <div className="hero__orb hero__orb--b" />
      </div>

      <div className="container hero__inner">
        <div className="hero__copy">
          <span className="eyebrow">ETB · 1946'dan beri · Doğu Anadolu</span>
          <h1 className="hero__title">
            <span className="hero__title-row hero__title-row--1" aria-label={heroTitleLead}>
              <span className="hero__title-lock" aria-hidden="true">
                <span className="hero__title-sizer">{heroTitleLead}</span>
                <span className="hero__title-scramble">{scrambledTitle}</span>
              </span>
            </span>
            <span className="hero__title-row hero__title-row--2">
              <span>
                <em className="hero__gold">Ticaret</em> Nabzı
              </span>
            </span>
            <span className="hero__title-row hero__title-row--3 mono">
              ↘ tarım · veri · piyasa · şeffaflık
            </span>
          </h1>

          <p className="hero__desc">
            Erzurum Ticaret Borsası; üretici, tüccar ve sanayiciyi güvenilir
            piyasa verileri, kurumsal hizmetler ve şeffaf ticaret altyapısıyla
            buluşturur. Bölgenin hububat, bakliyat ve canlı hayvan ekonomisine
            modern dijital omurga sağlıyoruz.
          </p>

          <div className="hero__cta">
            <a href="/fiyat-bulteni" className="btn btn-primary">
              Güncel Fiyatları İncele
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
            <a href="/fiyat-bulteni" className="btn btn-ghost">Fiyat Bültenine Git</a>
            <a href="/kurumsal" className="btn-link">Kurumsal Bilgi Al</a>
          </div>

          <div className="hero__kpi-strip" aria-label="Ana piyasa göstergeleri">
            <div className="hero__kpi" data-pulsable>
              <span className="hero__meta-label mono">Kurucu Yıl</span>
              <span className="hero__meta-value">1946</span>
            </div>
            <div className="hero__kpi" data-pulsable>
              <span className="hero__meta-label mono">Aktif Üye</span>
              <span className="hero__meta-value">1.842</span>
            </div>
            <div className="hero__kpi" data-pulsable>
              <span className="hero__meta-label mono">Günlük Hacim</span>
              <span className="hero__meta-value">
                284<small>,5 t</small>
              </span>
            </div>
            <div className="hero__kpi" data-pulsable>
              <span className="hero__meta-label mono">Endeks</span>
              <span className="hero__meta-value text-green">
                ▲ 1.284,5
              </span>
            </div>
          </div>
        </div>

        <HeroMosaic />
      </div>

      <div className="hero__scroll mono" aria-hidden>
        <span>aşağı kaydır</span>
        <span className="hero__scroll-line" />
      </div>
    </section>
  );
}
