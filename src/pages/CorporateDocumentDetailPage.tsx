import { Suspense, lazy } from "react";
import { Link, useParams } from "react-router-dom";
import PageHero from "../components/PageHero";
import SeoHead from "../components/SeoHead";
import { usePublicCorporateDocument } from "../hooks/usePublicApi";
import { ApiError, corporateDocumentDownloadUrl } from "../lib/publicApi";
import { sanitizeRichHtml } from "../lib/sanitizeHtml";
import "./CorporateDocumentPage.css";
import "./ReportDetailPage.css";

const PdfViewer = lazy(() => import("../components/PdfViewer"));

const CATEGORY_LABELS: Record<string, string> = {
  politika: "Kurumsal Politika",
  tarihce: "Tarihçe",
  plan: "İş Planı",
  organizasyon: "Organizasyon",
};

function hasPageContent(body: string | null | undefined): boolean {
  if (!body?.trim()) return false;
  const stripped = body.replace(/<[^>]+>/g, "").trim();
  return stripped.length > 0;
}

export default function CorporateDocumentDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: doc, isLoading, error } = usePublicCorporateDocument(slug);

  const err404 = error instanceof ApiError && error.status === 404;
  const path = slug ? `/kurumsal/belgeler/${slug}` : "/kurumsal";
  const categoryLabel = doc ? (CATEGORY_LABELS[doc.category] ?? doc.category) : "";
  const showPageContent = doc ? hasPageContent(doc.body) : false;

  return (
    <>
      <SeoHead
        title={doc?.title ?? (err404 ? "Belge bulunamadı" : "Kurumsal Belge")}
        description={
          doc?.summary ??
          "Erzurum Ticaret Borsası kurumsal belge ve politika dokümanları."
        }
        path={path}
        noindex={err404}
      />
      <PageHero
        breadcrumb="Kurumsal"
        eyebrow={categoryLabel || "Belge"}
        title={doc?.title ?? (err404 ? "Belge bulunamadı" : "Kurumsal Belge")}
        intro={
          err404
            ? "Bu adrese karşılık gelen bir belge yok veya erişime kapalı olabilir."
            : doc?.summary ??
              "Kurumsal belge içeriğine buradan ulaşabilirsiniz."
        }
      />

      <section className={showPageContent ? "corp-doc-page" : "report-detail"}>
        <div
          className={
            showPageContent
              ? "container corp-doc-page__inner"
              : "container report-detail__inner"
          }
        >
          <div className={showPageContent ? "corp-doc-page__toolbar" : undefined}>
            <nav
              className={
                showPageContent
                  ? "corp-doc-page__toolbar report-detail__back mono"
                  : "report-detail__back mono"
              }
            >
              <Link to="/kurumsal#kurumsal-belgeler">← Kurumsal belgeler</Link>
            </nav>
            {showPageContent && doc && (
              <a
                className="btn btn-ghost"
                href={corporateDocumentDownloadUrl(doc.slug)}
              >
                PDF İndir
              </a>
            )}
          </div>

          {isLoading && (
            <p className="report-detail__state">Belge yükleniyor…</p>
          )}

          {!isLoading && error && (
            <p className="report-detail__state report-detail__state--error">
              {err404
                ? "Belge bulunamadı."
                : "Belge yüklenirken bir sorun oluştu. Lütfen daha sonra tekrar deneyin."}
            </p>
          )}

          {!isLoading && doc && showPageContent && (
            <article className="corp-doc-page__article card">
              <header className="corp-doc-page__hero">
                <span className="mono">{categoryLabel}</span>
                <h2>{doc.title}</h2>
                {doc.summary && <p>{doc.summary}</p>}
              </header>
              <div
                className="corp-doc-page__body"
                dangerouslySetInnerHTML={{
                  __html: sanitizeRichHtml(doc.body!),
                }}
              />
            </article>
          )}

          {!isLoading && doc && !showPageContent && (
            <>
              <article className="report-detail__article card">
                <header className="report-detail__head">
                  {categoryLabel && (
                    <span className="mono report-detail__type">{categoryLabel}</span>
                  )}
                  <span className="mono report-detail__date">PDF</span>
                </header>
                {doc.summary && (
                  <p className="report-detail__summary">{doc.summary}</p>
                )}
                <div className="report-detail__actions">
                  <a
                    className="btn btn-primary"
                    href={corporateDocumentDownloadUrl(doc.slug)}
                  >
                    PDF İndir
                  </a>
                  <a
                    className="btn btn-ghost"
                    href={corporateDocumentDownloadUrl(doc.slug, true)}
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
                    src={corporateDocumentDownloadUrl(doc.slug, true)}
                    downloadUrl={corporateDocumentDownloadUrl(doc.slug)}
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
