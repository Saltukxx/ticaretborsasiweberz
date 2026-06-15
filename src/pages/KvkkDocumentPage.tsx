import { Suspense, lazy } from "react";
import { Link, useParams } from "react-router-dom";
import PageHero from "../components/PageHero";
import SeoHead from "../components/SeoHead";
import {
  getKvkkDocument,
  kvkkDocumentPdfUrl,
} from "../lib/kvkkDocuments";
import "./ReportDetailPage.css";

const PdfViewer = lazy(() => import("../components/PdfViewer"));

export default function KvkkDocumentPage() {
  const { slug } = useParams<{ slug: string }>();
  const doc = getKvkkDocument(slug);
  const err404 = !doc;
  const path = slug ? `/kvkk/${slug}` : "/kvkk";
  const pdfUrl = doc ? kvkkDocumentPdfUrl(doc) : "";

  return (
    <>
      <SeoHead
        title={doc?.title ?? "Belge bulunamadı"}
        description={
          doc?.summary ??
          "Erzurum Ticaret Borsası KVKK ve kişisel veriler belgeleri."
        }
        path={path}
        noindex={err404}
      />
      <PageHero
        breadcrumb="KVKK"
        eyebrow="Kişisel Veriler"
        title={doc?.title ?? (err404 ? "Belge bulunamadı" : "KVKK Belgesi")}
        intro={
          err404
            ? "Bu adrese karşılık gelen bir belge bulunamadı."
            : doc?.summary ?? "Resmi PDF belgeyi buradan görüntüleyebilirsiniz."
        }
      />

      <section className="report-detail">
        <div className="container report-detail__inner">
          <div className="report-detail__toolbar">
            <nav className="report-detail__back mono">
              <Link to="/kvkk">← KVKK belgeleri</Link>
            </nav>
            {doc && (
              <a className="btn btn-ghost" href={pdfUrl} download>
                PDF İndir
              </a>
            )}
          </div>

          {err404 && (
            <p className="report-detail__state report-detail__state--error">
              Belge bulunamadı.
            </p>
          )}

          {doc && (
            <>
              <article className="report-detail__article card">
                <p className="report-detail__summary">{doc.summary}</p>
                <div className="report-detail__actions">
                  <a className="btn btn-primary" href={pdfUrl} download>
                    PDF İndir
                  </a>
                  <a
                    className="btn btn-ghost"
                    href={pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Tarayıcıda aç
                  </a>
                </div>
              </article>

              <div className="report-detail__viewer">
                <Suspense
                  fallback={
                    <p className="report-detail__state">Görüntüleyici yükleniyor…</p>
                  }
                >
                  <PdfViewer
                    src={pdfUrl}
                    downloadUrl={pdfUrl}
                    title={doc.title}
                  />
                </Suspense>
              </div>
            </>
          )}
        </div>
      </section>
    </>
  );
}
