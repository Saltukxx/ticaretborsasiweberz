import { Link } from "react-router-dom";
import { usePublicServiceAgreements } from "../hooks/usePublicApi";
import type { PublicServiceAgreement } from "../lib/publicApi";
import { useReveal, useRevealCallback } from "../hooks/useReveal";
import "./ServiceAgreementsSection.css";

const CATEGORY_META: Record<
  string,
  { label: string; icon: "fuel" | "cargo" | "apparel" | "optics" }
> = {
  akaryakit: { label: "Akaryakıt", icon: "fuel" },
  kargo: { label: "Kargo & Lojistik", icon: "cargo" },
  giyim: { label: "İş Giyimi", icon: "apparel" },
  optik: { label: "Optik", icon: "optics" },
};

function CategoryIcon({ type }: { type: "fuel" | "cargo" | "apparel" | "optics" }) {
  if (type === "fuel") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden>
        <path d="M6 20V8l4-3v15M14 20V4h4l2 3v13" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
    );
  }
  if (type === "cargo") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden>
        <path d="M3 8h11v8H3zM14 10h4l3 3v3h-7zM7 18a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm10 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
    );
  }
  if (type === "apparel") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden>
        <path d="M12 3 7 7v14h10V7l-5-4Z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M4 12h16M12 4c2 3 2 13 0 16M12 4c-2 3-2 13 0 16" fill="none" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function AgreementCard({ item }: { item: PublicServiceAgreement }) {
  const meta = CATEGORY_META[item.category] ?? { label: "Anlaşma", icon: "cargo" as const };
  return (
    <article className="svc-agreements__card card">
      <div className="svc-agreements__card-top">
        <span className="svc-agreements__icon">
          <CategoryIcon type={meta.icon} />
        </span>
        <span className="mono svc-agreements__cat">{meta.label}</span>
      </div>
      <h3>{item.title}</h3>
      {item.summary && <p>{item.summary}</p>}
      <Link className="svc-agreements__cta" to={`/hizmetler/anlasmalar/${item.slug}`}>
        Detayları incele <span aria-hidden>→</span>
      </Link>
    </article>
  );
}

export default function ServiceAgreementsSection() {
  const gridRef = useRevealCallback<HTMLDivElement>();
  const { data, isLoading, isError } = usePublicServiceAgreements();
  const list = data ?? [];

  if (!isLoading && !isError && list.length === 0) return null;

  return (
    <section className="svc-agreements" id="anlasmalarimiz" aria-labelledby="svc-agreements-title">
      <div className="container">
        <div className="svc-agreements__head reveal" ref={useReveal<HTMLDivElement>()}>
          <span className="eyebrow">Üye Avantajları</span>
          <h2 id="svc-agreements-title">
            Anlaşma<em>larımız</em>
          </h2>
          <p>
            Borsamızın imzaladığı protokoller kapsamında üyelerimiz akaryakıt,
            kargo, iş giyimi ve optik hizmetlerinde indirimli fiyatlardan
            yararlanabilir.
          </p>
        </div>

        {isLoading && <p className="svc-agreements__state">Anlaşmalar yükleniyor…</p>}
        {isError && (
          <p className="svc-agreements__state svc-agreements__state--error">
            Anlaşmalar yüklenemedi. Lütfen daha sonra tekrar deneyin.
          </p>
        )}

        {!isLoading && !isError && list.length > 0 && (
          <div className="svc-agreements__grid reveal-stagger" ref={gridRef}>
            {list.map((item) => (
              <AgreementCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
