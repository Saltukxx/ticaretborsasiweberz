import { CORPORATE_PARTNERS } from "../data/corporate-partners";
import { useReveal } from "../hooks/useReveal";
import "./HomePartnersMarquee.css";

function PartnerLogo({ name, logo }: { name: string; logo: string }) {
  return (
    <div className="partners-marquee__item">
      <img src={logo} alt={name} loading="lazy" decoding="async" draggable={false} />
    </div>
  );
}

export default function HomePartnersMarquee() {
  const headRef = useReveal<HTMLDivElement>();

  return (
    <section
      className="partners-marquee"
      aria-labelledby="partners-marquee-title"
    >
      <div className="container">
        <header className="partners-marquee__head section-title reveal" ref={headRef}>
          <div>
            <span className="eyebrow">Paydaşlar · İş Birlikleri</span>
            <h2 id="partners-marquee-title">
              Kurumsal <em className="partners-marquee__em">İş Ortaklarımız</em>
            </h2>
          </div>
          <p>
            Bölgesel kalkınma, tarım ticareti ve kurumsal hizmetler alanında
            iş birliği yaptığımız kurum ve kuruluşlar.
          </p>
        </header>
      </div>

      <div className="partners-marquee__track-wrap">
        <div className="partners-marquee__fade partners-marquee__fade--left" aria-hidden />
        <div className="partners-marquee__fade partners-marquee__fade--right" aria-hidden />

        <div className="partners-marquee__viewport">
          <div className="partners-marquee__track">
            <div className="partners-marquee__row">
              {CORPORATE_PARTNERS.map((p) => (
                <PartnerLogo key={p.id} name={p.name} logo={p.logo} />
              ))}
            </div>
            <div className="partners-marquee__row" aria-hidden>
              {CORPORATE_PARTNERS.map((p) => (
                <PartnerLogo key={`dup-${p.id}`} name={p.name} logo={p.logo} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
