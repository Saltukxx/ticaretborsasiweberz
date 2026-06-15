import { Link, useParams } from "react-router-dom";
import PageHero from "../components/PageHero";
import SeoHead from "../components/SeoHead";
import { useNewsArticle } from "../hooks/usePublicApi";
import { ApiError } from "../lib/publicApi";
import { formatLongDate } from "../lib/formatLocalDate";
import { resolveMediaUrl } from "../lib/resolveMediaUrl";
import { resolveNewsLead, truncateAtWord } from "../lib/newsLead";
import { sanitizeRichHtml } from "../lib/sanitizeHtml";
import "./NewsDetailPage.css";

function toneClass(tone: string | null | undefined): string {
  if (!tone) return "";
  const safe = tone.replace(/[^a-z0-9-]/gi, "");
  return safe ? `news-detail__chip--${safe}` : "";
}

export default function NewsDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: article, isLoading, error } = useNewsArticle(slug);
  const err404 = error instanceof ApiError && error.status === 404;
  const path = slug ? `/haberler/${slug}` : "/haberler";
  const coverSrc = article?.coverUrl ? resolveMediaUrl(article.coverUrl) : null;
  const lead = article ? resolveNewsLead(article.excerpt, article.body) : null;

  return (
    <>
      <SeoHead
        title={article?.title ?? (err404 ? "Haber bulunamadı" : "Haber")}
        description={lead ? truncateAtWord(lead, 160) : "Erzurum Ticaret Borsası kurumsal haber detayı."}
        path={path}
        image={coverSrc ?? undefined}
        noindex={err404}
        type="article"
        article={
          article
            ? {
                path,
                datePublished: article.publishedAt,
              }
            : undefined
        }
      />
      <PageHero
        breadcrumb="Haberler"
        eyebrow={article?.category ?? "Haber"}
        title={article?.title ?? (err404 ? "Haber bulunamadı" : "Haber")}
        intro={lead ?? "Kurumsal haber detayı."}
      />
      <section className="news-detail">
        <div className="container news-detail__inner">
          <nav className="news-detail__back mono">
            <Link to="/haberler">← Tüm haberler</Link>
          </nav>

          {isLoading && <p className="news-detail__state">Haber yükleniyor…</p>}

          {!isLoading && error && (
            <p className="news-detail__state news-detail__state--error">
              {err404
                ? "Haber bulunamadı veya yayından kaldırılmış olabilir."
                : "Haber yüklenirken bir sorun oluştu."}
            </p>
          )}

          {!isLoading && article && (
            <article
              className={`news-detail__article${coverSrc ? " news-detail__article--with-cover" : ""}`}
            >
              {coverSrc && (
                <figure className="news-detail__cover">
                  <img
                    src={coverSrc}
                    alt={article.title}
                    loading="eager"
                    decoding="async"
                  />
                  <figcaption className="news-detail__cover-meta">
                    {article.category && (
                      <span className={`news-detail__chip mono ${toneClass(article.tone)}`}>
                        {article.category}
                      </span>
                    )}
                    {article.publishedAt && (
                      <time className="news-detail__date mono" dateTime={article.publishedAt}>
                        {formatLongDate(article.publishedAt)}
                      </time>
                    )}
                  </figcaption>
                </figure>
              )}

              <div className="news-detail__panel card">
                {!coverSrc && (
                  <header className="news-detail__head">
                    {article.category && (
                      <span className={`news-detail__chip mono ${toneClass(article.tone)}`}>
                        {article.category}
                      </span>
                    )}
                    {article.publishedAt && (
                      <time className="news-detail__date mono" dateTime={article.publishedAt}>
                        {formatLongDate(article.publishedAt)}
                      </time>
                    )}
                  </header>
                )}

                {lead && (
                  <p className="news-detail__lead">{lead}</p>
                )}

                {article.body ? (
                  <div
                    className="news-detail__body"
                    dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(article.body) }}
                  />
                ) : null}
              </div>
            </article>
          )}
        </div>
      </section>
    </>
  );
}
