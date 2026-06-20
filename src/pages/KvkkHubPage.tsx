import { Link } from "react-router-dom";
import PageHero from "../components/PageHero";
import SeoHead from "../components/SeoHead";
import { useReveal } from "../hooks/useReveal";
import {
  KVKK_DOCUMENTS,
  kvkkDocumentPagePath,
  kvkkDocumentPdfUrl,
} from "../lib/kvkkDocuments";
import "../components/CorporateDocumentsSection.css";
import "./KvkkHubPage.css";

export default function KvkkHubPage() {
  const panelRef = useReveal<HTMLDivElement>();

  return (
    <>
      <SeoHead
        title="KVKK ve Kişisel Veriler"
        description="Erzurum Ticaret Borsası KVKK aydınlatma metinleri, gizlilik ve çerez politikaları."
        path="/kvkk"
      />
      <PageHero
        breadcrumb="KVKK"
        eyebrow="Kişisel Veriler"
        title="KVKK Belgeleri"
        intro="6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında yayımlanan resmi metinlere buradan ulaşabilirsiniz."
      />

      <section className="corp-docs kvkk-hub">
        <div className="container">
          <div className="corp-docs__panel card kvkk-hub__panel reveal" ref={panelRef}>
            <header className="corp-docs__panel-head">
              <div>
                <span className="mono corp-docs__panel-eyebrow">Resmi PDF belgeler</span>
                <h3>Kişisel Verilerin Korunması</h3>
              </div>
              <p>
                Aydınlatma metinleri ve kurumsal politikalar PDF olarak görüntülenebilir ve
                indirilebilir.
              </p>
            </header>

            <ul className="corp-docs__register kvkk-hub__register">
              {KVKK_DOCUMENTS.map((doc) => (
                <li key={doc.slug}>
                  <div className="kvkk-hub__item">
                    <Link
                      to={kvkkDocumentPagePath(doc.slug)}
                      className="corp-docs__register-item kvkk-hub__item-main"
                    >
                      <span className="corp-docs__register-main">
                        <span className="corp-docs__register-title">{doc.title}</span>
                        <span className="corp-docs__register-sum">{doc.summary}</span>
                      </span>
                      <span className="corp-docs__register-arrow" aria-hidden>
                        →
                      </span>
                    </Link>
                    <div className="kvkk-hub__item-actions">
                      <Link className="btn-link" to={kvkkDocumentPagePath(doc.slug)}>
                        İncele
                      </Link>
                      <a
                        className="corp-docs__cell-pdf mono"
                        href={kvkkDocumentPdfUrl(doc)}
                        download
                      >
                        PDF indir
                      </a>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </>
  );
}
