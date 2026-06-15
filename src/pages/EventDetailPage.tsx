import { Link, useParams } from "react-router-dom";
import PageHero from "../components/PageHero";
import SeoHead from "../components/SeoHead";
import { usePublicEvent } from "../hooks/usePublicApi";
import { ApiError } from "../lib/publicApi";
import { formatLongDate } from "../lib/formatLocalDate";
import "./ContentDetailPage.css";

export default function EventDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: event, isLoading, error } = usePublicEvent(slug);
  const err404 = error instanceof ApiError && error.status === 404;
  const path = slug ? `/etkinlikler/${slug}` : "/etkinlikler";

  const dateLabel = event?.startsAt
    ? formatLongDate(event.startsAt)
    : null;
  const timeStr = event?.startsAt
    ? new Date(event.startsAt).toLocaleTimeString("tr-TR", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <>
      <SeoHead
        title={event?.title ?? (err404 ? "Etkinlik bulunamadı" : "Etkinlik")}
        description={event?.description ?? "Erzurum Ticaret Borsası etkinlik detayı."}
        path={path}
        noindex={err404}
        type="article"
        article={
          event?.startsAt
            ? { path, datePublished: event.startsAt }
            : undefined
        }
      />
      <PageHero
        breadcrumb="Etkinlikler"
        eyebrow={event?.statusLabel ?? "Kurumsal etkinlik"}
        title={event?.title ?? (err404 ? "Etkinlik bulunamadı" : "Etkinlik")}
        intro={event?.description ?? "Etkinlik programı ve katılım bilgileri."}
      />
      <section className="content-detail">
        <div className="container content-detail__inner">
          <nav className="content-detail__back mono">
            <Link to="/etkinlikler">← Tüm etkinlikler</Link>
          </nav>

          {isLoading && <p className="content-detail__state">Etkinlik yükleniyor…</p>}

          {!isLoading && error && (
            <p className="content-detail__state content-detail__state--error">
              {err404
                ? "Etkinlik bulunamadı veya yayından kaldırılmış olabilir."
                : "Etkinlik yüklenirken bir sorun oluştu."}
            </p>
          )}

          {!isLoading && event && (
            <article className="content-detail__article card">
              <dl className="content-detail__meta-grid">
                {dateLabel && (
                  <div>
                    <dt>Tarih</dt>
                    <dd>{dateLabel}</dd>
                  </div>
                )}
                {timeStr && (
                  <div>
                    <dt>Saat</dt>
                    <dd className="mono">{timeStr}</dd>
                  </div>
                )}
                {event.location && (
                  <div>
                    <dt>Konum</dt>
                    <dd>{event.location}</dd>
                  </div>
                )}
              </dl>
              {event.description && (
                <p className="content-detail__lead">{event.description}</p>
              )}
              <div className="content-detail__actions">
                <Link
                  className="btn btn-primary"
                  to={`/iletisim?konu=${encodeURIComponent(`Etkinlik: ${event.title}`)}`}
                >
                  Katılım bilgisi al
                </Link>
              </div>
            </article>
          )}
        </div>
      </section>
    </>
  );
}
