import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { NavLink } from "react-router-dom";
import { prefetchPriceBulletin } from "../lib/prefetchBulletin";
import { HEADER_UTIL_LINKS } from "../lib/externalLinks";
import { lockBodyScroll, unlockBodyScroll } from "../lib/bodyScrollLock";
import { WHATSAPP_PHONE_DISPLAY, WHATSAPP_URL } from "../lib/siteContacts";
import SearchOverlay from "./SearchOverlay";
import LiveMarketStrip from "./LiveMarketStrip";
import HeaderCerts from "./HeaderCerts";
import "./Header.css";

/** 80. yıl logosu — header solunda, ana markadan önce */
const ANNIVERSARY_LOGO = `/header/80-yil-logo.png?v=4`;

const MEMBER_PORTAL_URL =
  (import.meta.env.VITE_MEMBER_PORTAL_URL as string | undefined)?.trim() || null;

/** Footer'daki e-bülten formuna kaydırıp ilk inputa odaklanır. */
function scrollToNewsletter() {
  const el = document.getElementById("newsletter");
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "center" });
  const input = el.querySelector<HTMLInputElement>("input[type='email']");
  if (input) setTimeout(() => input.focus({ preventScroll: true }), 550);
}

const nav = [
  { to: "/", label: "Anasayfa" },
  { to: "/kurumsal", label: "Kurumsal" },
  { to: "/cografi-isaretler", label: "Coğrafi İşaretler" },
  { to: "/fiyat-bulteni", label: "Fiyat Bülteni" },
  { to: "/haberler", label: "Haberler" },
  { to: "/duyurular", label: "Duyurular" },
  { to: "/etkinlikler", label: "Etkinlikler" },
  { to: "/raporlar", label: "Raporlar" },
  { to: "/projeler", label: "Projeler" },
  { to: "/hizmetler", label: "Hizmetler" },
  { to: "/kvkk", label: "KVKK" },
  { to: "/iletisim", label: "İletişim" },
];

export default function Header() {
  const queryClient = useQueryClient();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    let isScrolled = window.scrollY > 48;

    const onScroll = () => {
      const y = window.scrollY;
      if (!isScrolled && y > 48) {
        isScrolled = true;
        setScrolled(true);
      } else if (isScrolled && y < 8) {
        isScrolled = false;
        setScrolled(false);
      }
    };

    setScrolled(isScrolled);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    lockBodyScroll("header-menu");
    return () => unlockBodyScroll("header-menu");
  }, [open]);

  useEffect(() => {
    const root = document.querySelector(".site-header");
    if (!root) return;

    const syncHeaderHeight = () => {
      document.documentElement.style.setProperty(
        "--site-header-height",
        `${root.getBoundingClientRect().height}px`,
      );
    };

    syncHeaderHeight();
    const observer = new ResizeObserver(syncHeaderHeight);
    observer.observe(root);
    window.addEventListener("resize", syncHeaderHeight);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", syncHeaderHeight);
    };
  }, []);

  return (
    <div className={`site-header ${open ? "is-menu-open" : ""} ${scrolled ? "is-scrolled" : ""}`}>
      <div className="topbar">
        <div className="container topbar__inner">
          <nav className="topbar__utils" aria-label="Hızlı işlemler">
            {HEADER_UTIL_LINKS.map((link, index) => (
              <span key={link.href} className="topbar__util-item">
                {index > 0 ? <span className="topbar__util-sep" aria-hidden="true" /> : null}
                <a href={link.href} target="_blank" rel="noopener noreferrer">
                  {link.label}
                </a>
              </span>
            ))}
          </nav>
          <div className="topbar__meta mono">
            <span className="topbar__hours">Çalışma Saatleri: 08:00 — 17:00</span>
            <span className="topbar__sep">·</span>
            <a href="tel:+904422345678">+90 442 234 56 78</a>
            <span className="topbar__sep">·</span>
            <a
              className="topbar__whatsapp"
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              WhatsApp <span className="topbar__wa-num">{WHATSAPP_PHONE_DISPLAY}</span>
            </a>
          </div>
        </div>
      </div>

      <header className="header">
        <div className="container header__inner">
          <div className="header__left">
            <img
              src={ANNIVERSARY_LOGO}
              alt="80. Yıl"
              className="header__anniversary"
              loading="eager"
              decoding="async"
            />
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
            <HeaderCerts />
          </div>

          <div className="header__actions">
            <button
              className="header__icon"
              aria-label="Ara"
              type="button"
              onClick={() => {
                setOpen(false);
                setSearchOpen(true);
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.6" />
                <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </button>
            <span className="header__lang mono">TR</span>
            <button
              className="btn btn-ghost header__btn"
              type="button"
              onClick={() => {
                setOpen(false);
                scrollToNewsletter();
              }}
            >
              e-Bülten
            </button>
            {MEMBER_PORTAL_URL ? (
              <a
                className="btn btn-primary header__btn header__btn--primary"
                href={MEMBER_PORTAL_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                Üye Girişi
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </a>
            ) : (
              <NavLink
                className="btn btn-primary header__btn header__btn--primary"
                to="/iletisim"
                onClick={() => setOpen(false)}
              >
                Üye Girişi
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </NavLink>
            )}
            <button
              className={`header__burger ${open ? "is-open" : ""}`}
              aria-label={open ? "Menüyü kapat" : "Menüyü aç"}
              aria-expanded={open}
              type="button"
              onClick={() => setOpen((o) => !o)}
            >
              <span /> <span /> <span />
            </button>
          </div>
        </div>

        <div className="container header__nav-shell">
          <nav className={`header__nav ${open ? "is-open" : ""}`} aria-label="Ana menü">
            {nav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                onClick={() => setOpen(false)}
                onMouseEnter={
                  item.to === "/fiyat-bulteni"
                    ? () => prefetchPriceBulletin(queryClient)
                    : undefined
                }
                className={({ isActive }) =>
                  `header__link ${isActive ? "is-active" : ""}`
                }
              >
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <LiveMarketStrip />

      <button
        type="button"
        className="header__backdrop"
        aria-label="Menüyü kapat"
        tabIndex={open ? 0 : -1}
        onClick={() => setOpen(false)}
      />

      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}
