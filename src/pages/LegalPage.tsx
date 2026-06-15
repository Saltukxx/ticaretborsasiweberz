import { Link, Navigate, useParams } from "react-router-dom";
import PageHero from "../components/PageHero";
import SeoHead from "../components/SeoHead";
import { useLegalPage } from "../hooks/usePublicApi";
import { ApiError } from "../lib/publicApi";
import { LEGAL_SLUG_REDIRECTS, kvkkDocumentPagePath } from "../lib/kvkkDocuments";
import { sanitizeRichHtml } from "../lib/sanitizeHtml";
import "./ContentDetailPage.css";

const SLUG_TITLES: Record<string, string> = {
  kvkk: "KVKK Aydınlatma",
  gizlilik: "Gizlilik Politikası",
  cerez: "Çerez Politikası",
  erisilebilirlik: "Erişilebilirlik",
};

export default function LegalPage() {
  const { slug } = useParams<{ slug: string }>();
  const kvkkRedirect = slug ? LEGAL_SLUG_REDIRECTS[slug] : undefined;
  if (kvkkRedirect) {
    return <Navigate to={kvkkDocumentPagePath(kvkkRedirect)} replace />;
  }
  return <LegalPageContent slug={slug} />;
}

function LegalPageContent({ slug }: { slug: string | undefined }) {
  const { data: page, isLoading, error } = useLegalPage(slug);
  const err404 = error instanceof ApiError && error.status === 404;
  const path = slug ? `/yasal/${slug}` : "/";
  const fallbackTitle = slug ? SLUG_TITLES[slug] ?? "Yasal" : "Yasal";

  return (
    <>
      <SeoHead
        title={page?.title ?? fallbackTitle}
        description={`Erzurum Ticaret Borsası — ${page?.title ?? fallbackTitle}.`}
        path={path}
        noindex={err404 || page?.isPublished === false}
      />
      <PageHero
        breadcrumb="Yasal"
        eyebrow="Kurumsal"
        title={page?.title ?? fallbackTitle}
        intro="Kurumsal yasal metinler ve bilgilendirme sayfaları."
      />
      <section className="content-detail">
        <div className="container content-detail__inner">
          <nav className="content-detail__back mono">
            <Link to="/">← Ana sayfa</Link>
          </nav>

          {isLoading && <p className="content-detail__state">Yükleniyor…</p>}

          {!isLoading && error && (
            <p className="content-detail__state content-detail__state--error">
              {err404 ? "Sayfa bulunamadı veya henüz yayımlanmadı." : "Sayfa yüklenemedi."}
            </p>
          )}

          {!isLoading && page && (
            <article className="content-detail__article card">
              <div
                className="content-detail__body prose"
                dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(page.body) }}
              />
            </article>
          )}
        </div>
      </section>
    </>
  );
}
