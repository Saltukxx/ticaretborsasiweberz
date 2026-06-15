import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./CookieConsentBanner.css";

const STORAGE_KEY = "etb:cookie-consent";

type ConsentValue = "accepted" | "rejected";

function readConsent(): ConsentValue | null {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === "accepted" || v === "rejected") return v;
  } catch {
    /* ignore */
  }
  return null;
}

function writeConsent(value: ConsentValue) {
  try {
    localStorage.setItem(STORAGE_KEY, value);
  } catch {
    /* ignore */
  }
}

export default function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(readConsent() === null);
  }, []);

  const dismiss = (value: ConsentValue) => {
    writeConsent(value);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      className="cookie-banner"
      role="dialog"
      aria-labelledby="cookie-banner-title"
      aria-describedby="cookie-banner-desc"
    >
      <div className="cookie-banner__inner">
        <div className="cookie-banner__text">
          <p id="cookie-banner-title" className="cookie-banner__title">
            Çerez kullanımı
          </p>
          <p id="cookie-banner-desc" className="cookie-banner__desc">
            Web sitemizde zorunlu çerezler kullanılmaktadır. Detaylı bilgi için{" "}
            <Link to="/kvkk/gizlilik-cerez">Gizlilik ve Çerez Politikası</Link>
            &apos;nı inceleyebilirsiniz.
          </p>
        </div>
        <div className="cookie-banner__actions">
          <button type="button" className="btn btn-ghost" onClick={() => dismiss("rejected")}>
            Reddet
          </button>
          <button type="button" className="btn btn-primary" onClick={() => dismiss("accepted")}>
            Kabul Et
          </button>
        </div>
      </div>
    </div>
  );
}
