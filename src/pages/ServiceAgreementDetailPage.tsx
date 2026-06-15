import { Link, useParams } from "react-router-dom";
import PageHero from "../components/PageHero";
import SeoHead from "../components/SeoHead";
import { usePublicServiceAgreement } from "../hooks/usePublicApi";
import { ApiError } from "../lib/publicApi";
import { sanitizeRichHtml } from "../lib/sanitizeHtml";
import "./ContentDetailPage.css";

export default function ServiceAgreementDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: agreement, isLoading, error } = usePublicServiceAgreement(slug);
  const err404 = error instanceof ApiError && error.status === 404;
  const path = slug ? `/hizmetler/anlasmalar/${slug}` : "/hizmetler";

  return (
    <>
      <SeoHead
        title={agreement?.title ?? "Anlaşma"}
        description={
          agreement?.summary ??
          "Erzurum Ticaret Borsası üye anlaşması detayları."
        }
        path={path}
        noindex={err404}
      />
      <PageHero
        breadcrumb="Hizmetler · Anlaşmalarımız"
        eyebrow="Üye Avantajları"
        title={agreement?.title ?? "Anlaşma"}
        intro={agreement?.summary ?? "Protokol kapsamı ve başvuru bilgileri."}
      />
      <section className="content-detail">
        <div className="container content-detail__inner">
          <nav className="content-detail__back mono">
            <Link to="/hizmetler#anlasmalarimiz">← Anlaşmalarımız</Link>
          </nav>

          {isLoading && <p className="content-detail__state">Yükleniyor…</p>}

          {!isLoading && error && (
            <p className="content-detail__state content-detail__state--error">
              {err404 ? "Anlaşma bulunamadı." : "Anlaşma yüklenemedi."}
            </p>
          )}

          {!isLoading && agreement && (
            <article className="content-detail__article card">
              <div
                className="content-detail__body prose"
                dangerouslySetInnerHTML={{
                  __html: sanitizeRichHtml(agreement.body),
                }}
              />
            </article>
          )}
        </div>
      </section>
    </>
  );
}
