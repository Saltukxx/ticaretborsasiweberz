import { Link, useParams } from "react-router-dom";
import PageHero from "../components/PageHero";
import SeoHead from "../components/SeoHead";
import { useAnnouncement } from "../hooks/usePublicApi";
import { ApiError } from "../lib/publicApi";
import { formatLongDate } from "../lib/formatLocalDate";
import { sanitizeRichHtml } from "../lib/sanitizeHtml";
import "./ContentDetailPage.css";

export default function AnnouncementDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: item, isLoading, error } = useAnnouncement(slug);
  const err404 = error instanceof ApiError && error.status === 404;
  const path = slug ? `/duyurular/${slug}` : "/duyurular";

  return (
    <>
      <SeoHead
        title={item?.title ?? (err404 ? "Duyuru bulunamadı" : "Duyuru")}
        description="Erzurum Ticaret Borsası resmi duyuru metni."
        path={path}
        noindex={err404}
        type="article"
        article={
          item
            ? {
                path,
                datePublished: item.publishedAt,
              }
            : undefined
        }
      />
      <PageHero
        breadcrumb="Duyurular"
        eyebrow="Kurumsal duyuru"
        title={item?.title ?? (err404 ? "Duyuru bulunamadı" : "Duyuru")}
        intro="Üyeler ve ziyaretçiler için resmi duyuru metni."
      />
      <section className="content-detail">
        <div className="container content-detail__inner">
          <nav className="content-detail__back mono">
            <Link to="/duyurular">← Tüm duyurular</Link>
          </nav>

          {isLoading && <p className="content-detail__state">Duyuru yükleniyor…</p>}

          {!isLoading && error && (
            <p className="content-detail__state content-detail__state--error">
              {err404
                ? "Duyuru bulunamadı, süresi dolmuş veya yayından kaldırılmış olabilir."
                : "Duyuru yüklenirken bir sorun oluştu."}
            </p>
          )}

          {!isLoading && item && (
            <article className="content-detail__article card">
              <header className="content-detail__head mono">
                {item.publishedAt && <span>{formatLongDate(item.publishedAt)}</span>}
              </header>
              {item.body ? (
                <div
                  className="content-detail__body prose"
                  dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(item.body) }}
                />
              ) : null}
            </article>
          )}
        </div>
      </section>
    </>
  );
}
