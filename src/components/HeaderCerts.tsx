const CERT_VERSION = "4";

const CERT_LOGOS = [
  {
    src: "/header/tobb.png",
    alt: "TOBB — Türkiye Odalar ve Borsalar Birliği",
    maxW: 54,
    href: "https://www.tobb.org.tr/Sayfalar/AnaSayfa.php",
  },
  { src: "/header/tobb-akredite.png", alt: "TOBB Akredite Borsa", maxW: 168 },
  { src: "/header/iso-9000.png", alt: "TSE ISO EN 9000 Kalite Yönetim Sistemi", maxW: 54 },
  {
    src: "/header/iqnet.png",
    alt: "IQNet Uluslararası Sertifikasyon Ağı",
    maxW: 92,
    href: "https://www.iqnet-certification.com/",
  },
] as const;

export default function HeaderCerts() {
  return (
    <div className="header__certs" aria-label="Akreditasyon ve sertifikalar">
      {CERT_LOGOS.map((logo) => {
        const image = (
          <img
            src={`${logo.src}?v=${CERT_VERSION}`}
            alt={logo.alt}
            className="header__cert"
            style={{ maxWidth: logo.maxW }}
            loading="lazy"
            decoding="async"
          />
        );

        if (!("href" in logo) || !logo.href) {
          return <span key={logo.src}>{image}</span>;
        }

        return (
          <a
            key={logo.src}
            className="header__cert-link"
            href={logo.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={logo.alt}
          >
            {image}
          </a>
        );
      })}
    </div>
  );
}
