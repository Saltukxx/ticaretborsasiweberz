import { Link } from "react-router-dom";
import { usePublicCorporateDocuments } from "../hooks/usePublicApi";
import type { PublicCorporateDocument } from "../lib/publicApi";
import { corporateDocumentDownloadUrl } from "../lib/publicApi";
import { useReveal, useRevealCallback } from "../hooks/useReveal";
import "./CorporateDocumentsSection.css";

const CATEGORY_META: Record<string, { label: string; featured?: boolean }> = {
  tarihce: { label: "Tarihçe", featured: true },
  organizasyon: { label: "Organizasyon", featured: true },
  plan: { label: "İş Planı", featured: true },
  politika: { label: "Kurumsal Politika" },
};

function PanelHead({
  eyebrow,
  title,
  note,
}: {
  eyebrow: string;
  title: string;
  note?: string;
}) {
  return (
    <header className="corp-docs__panel-head">
      <div>
        <span className="mono corp-docs__panel-eyebrow">{eyebrow}</span>
        <h3>{title}</h3>
      </div>
      {note && <p>{note}</p>}
    </header>
  );
}

function FeaturedCell({ doc }: { doc: PublicCorporateDocument }) {
  const meta = CATEGORY_META[doc.category];
  return (
    <article className="corp-docs__featured-cell">
      <span className="mono corp-docs__cell-tag">{meta?.label ?? "Belge"}</span>
      <h4>{doc.title}</h4>
      {doc.summary && <p>{doc.summary}</p>}
      <footer className="corp-docs__cell-foot">
        <Link className="btn-link" to={`/kurumsal/belgeler/${doc.slug}`}>
          İncele
        </Link>
        <a
          className="corp-docs__cell-pdf mono"
          href={corporateDocumentDownloadUrl(doc.slug)}
          download
        >
          PDF indir
        </a>
      </footer>
    </article>
  );
}

function PolicyRegisterItem({ doc }: { doc: PublicCorporateDocument }) {
  return (
    <li>
      <Link to={`/kurumsal/belgeler/${doc.slug}`} className="corp-docs__register-item">
        <span className="corp-docs__register-main">
          <span className="corp-docs__register-title">{doc.title}</span>
          {doc.summary && (
            <span className="corp-docs__register-sum">{doc.summary}</span>
          )}
        </span>
        <span className="corp-docs__register-arrow" aria-hidden>
          →
        </span>
      </Link>
    </li>
  );
}

export default function CorporateDocumentsSection() {
  const featuredRef = useRevealCallback<HTMLDivElement>();
  const policiesRef = useRevealCallback<HTMLDivElement>();
  const { data: docs, isLoading, isError } = usePublicCorporateDocuments();
  const list = docs ?? [];

  const featured = list.filter((d) => CATEGORY_META[d.category]?.featured);
  const policies = list.filter((d) => d.category === "politika");

  if (!isLoading && !isError && list.length === 0) return null;

  return (
    <section className="corp-docs" id="kurumsal-belgeler" aria-labelledby="corp-docs-title">
      <div className="container">
        <div className="section-title reveal" ref={useReveal<HTMLDivElement>()}>
          <div>
            <span className="eyebrow">Kurumsal İçerik</span>
            <h2 id="corp-docs-title">
              Kurumsal <em className="corp-docs__em">Belgeler</em>
            </h2>
          </div>
          <p>
            Tarihçe, organizasyon yapısı, iş planı ve politika metinlerine ait
            güncel içerikler. Metinler doğrudan sitede okunabilir; PDF indirme
            isteğe bağlıdır.
          </p>
        </div>

        {isLoading && <p className="corp-docs__state">Belgeler yükleniyor…</p>}
        {isError && (
          <p className="corp-docs__state corp-docs__state--error">
            Belgeler yüklenemedi. Lütfen daha sonra tekrar deneyin.
          </p>
        )}

        {!isLoading && !isError && featured.length > 0 && (
          <div className="corp-docs__panel card reveal" ref={featuredRef}>
            <PanelHead
              eyebrow="Temel belgeler"
              title="Kurumsal referans metinleri"
              note="Tarihçe, organizasyon ve iş planına ait güncel içerikler."
            />
            <div className="corp-docs__featured-grid">
              {featured.map((doc) => (
                <FeaturedCell key={doc.id} doc={doc} />
              ))}
            </div>
          </div>
        )}

        {!isLoading && !isError && policies.length > 0 && (
          <div className="corp-docs__panel card reveal" ref={policiesRef}>
            <PanelHead
              eyebrow="Politika metinleri"
              title="Kurumsal Politikalar"
              note={`${policies.length} politika metni tam sayfa içerik olarak yayımlanmaktadır.`}
            />
            <ul className="corp-docs__register-list">
              {policies.map((doc) => (
                <PolicyRegisterItem key={doc.id} doc={doc} />
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
