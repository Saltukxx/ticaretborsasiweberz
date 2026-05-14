import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import "./Header.css";

const nav = [
  { to: "/", label: "Anasayfa" },
  { to: "/kurumsal", label: "Kurumsal" },
  { to: "/cografi-isaretler", label: "Coğrafi İşaretler" },
  { to: "/piyasa-verileri", label: "Piyasa Verileri" },
  { to: "/fiyat-bulteni", label: "Fiyat Bülteni" },
  { to: "/haberler", label: "Haberler" },
  { to: "/duyurular", label: "Duyurular" },
  { to: "/raporlar", label: "Raporlar" },
  { to: "/hizmetler", label: "Hizmetler" },
  { to: "/iletisim", label: "İletişim" },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <div className="topbar">
        <div className="container topbar__inner">
          <div className="topbar__right mono">
            <span>Çalışma Saatleri: 08:30 — 17:30</span>
            <span className="topbar__sep">·</span>
            <a href="tel:+904422345678">+90 442 234 56 78</a>
          </div>
        </div>
      </div>

      <header className={`header ${scrolled ? "is-scrolled" : ""}`}>
        <div className="container header__inner">
          <NavLink to="/" className="header__brand" onClick={() => setOpen(false)}>
            <img
              src="/erzurum-ticaret-borsasi-logo.png"
              alt="Erzurum Ticaret Borsası"
              className="header__logo"
            />
            <div className="header__brand-text">
              <span className="header__brand-line">Erzurum</span>
              <span className="header__brand-line header__brand-line--strong">
                Ticaret Borsası
              </span>
              <span className="header__brand-est mono">Kuruluş · 1946</span>
            </div>
          </NavLink>

          <nav className={`header__nav ${open ? "is-open" : ""}`}>
            {nav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `header__link ${isActive ? "is-active" : ""}`
                }
              >
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>

          <div className="header__actions">
            <button className="header__icon" aria-label="Ara">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.6" />
                <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </button>
            <span className="header__lang mono">TR</span>
            <button className="btn btn-ghost header__btn">e-Bülten</button>
            <button className="btn btn-primary header__btn header__btn--primary">
              Üye Girişi
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button
              className={`header__burger ${open ? "is-open" : ""}`}
              aria-label="Menü"
              onClick={() => setOpen((o) => !o)}
            >
              <span /> <span /> <span />
            </button>
          </div>
        </div>
      </header>
    </>
  );
}
