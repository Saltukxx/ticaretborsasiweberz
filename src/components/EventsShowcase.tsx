import type { CSSProperties } from "react";
import { useMemo } from "react";
import { Link } from "react-router-dom";
import { usePublicEvents } from "../hooks/usePublicApi";
import { formatEventsBoardStamp } from "../lib/formatEventsBoardStamp";
import { useCountUp, useReveal } from "../hooks/useReveal";
import "./EventsShowcase.css";

const LIST_LIMIT = 100;

export default function EventsShowcase() {
  const boardRef = useReveal<HTMLDivElement>();
  const timelineRef = useReveal<HTMLDivElement>();

  const {
    data: listData,
    isLoading: listLoading,
    isError: listError,
  } = usePublicEvents(LIST_LIMIT, "all");
  const { data: upcomingData } = usePublicEvents(LIST_LIMIT, "upcoming");

  const events = listData ?? [];
  const upcomingForKpi = upcomingData ?? [];
  const now = Date.now();

  const totalPrograms = upcomingForKpi.length;
  const openRegistrations = upcomingForKpi.filter((e) => e.registrationOpen).length;
  const stakeholderPrograms = upcomingForKpi.filter((e) => e.isStakeholder).length;

  const stamp = useMemo(() => formatEventsBoardStamp(events), [events]);
  const contentReady = !listLoading && !listError;

  return (
    <section className="events-showcase">
      <div className="container">
        <div className="events-board reveal" ref={boardRef}>
          <div className="events-board__lead">
            <span className="eyebrow">Kurumsal Program Panosu</span>
            <h2>Yakın dönemde üyeler ve paydaşlarla buluşacak güçlü bir takvim hazırlıyoruz.</h2>
            <p className="events-board__subtitle">
              Tarihler kesinleştikçe duyuru ve kayıt koşulları güncellenir; etkinlik detayları aşağıdaki kartlarda
              gruplanır.
            </p>
            {listLoading && <p className="events-showcase__status">Etkinlikler yükleniyor…</p>}
            {listError && (
              <p className="events-showcase__status">Etkinlik listesi şu an yüklenemedi. Lütfen daha sonra deneyin.</p>
            )}
          </div>
          <div className="events-board__kpis" aria-label="Planlanan program özeti">
            <EventsKpi value={listLoading ? 0 : totalPrograms} label="Yaklaşan Program" suffix="" />
            <EventsKpi value={listLoading ? 0 : openRegistrations} label="Kayıt Açık" suffix="" />
            <EventsKpi value={listLoading ? 0 : stakeholderPrograms} label="Paydaş Odaklı Etkinlik" suffix="" />
          </div>
          {stamp ? (
            <div className="events-board__stamp mono" aria-hidden="true">
              {stamp.months.map((month, i) => (
                <span key={month}>
                  {i > 0 ? (
                    <span aria-hidden="true">
                      {" "}
                      ·{" "}
                    </span>
                  ) : null}
                  {month}
                </span>
              ))}
              {stamp.months.length > 0 ? (
                <span aria-hidden="true">
                  {" "}
                  ·{" "}
                </span>
              ) : null}
              <span>{stamp.year}</span>
            </div>
          ) : null}
        </div>

        <div className="events-timeline reveal" ref={timelineRef} aria-label="Planlanan etkinlikler listesi">
          {contentReady && events.length === 0 ? (
            <p className="events-showcase__status">Henüz yayınlanmış etkinlik bulunmuyor.</p>
          ) : null}
          {contentReady &&
            events.map((event, index) => {
              const parts = shortDateParts(event.startsAt);
              const timeStr = event.startsAt
                ? new Date(event.startsAt).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })
                : "";
              const dateLabel = event.startsAt
                ? new Date(event.startsAt).toLocaleDateString("tr-TR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })
                : "—";
              const isPast = event.startsAt ? new Date(event.startsAt).getTime() < now : false;
              const statusText =
                event.statusLabel?.trim() ||
                (isPast ? "Tamamlandı" : event.registrationOpen ? "Kayıt açık" : "Planlandı");
              return (
                <article
                  key={event.id}
                  className={`events-row${isPast ? " events-row--past" : ""}`}
                  id={`etkinlik-${event.id}`}
                  style={{ "--delay": `${index * 0.08}s` } as CSSProperties}
                >
                  <div className="events-row__rail">
                    <span className="events-row__node" aria-hidden />
                    <div className="events-row__date mono">
                      <span className="events-row__date-day">{parts.day}</span>
                      <span className="events-row__date-meta">
                        <span>{parts.month}</span>
                        <span>{parts.year}</span>
                      </span>
                    </div>
                    <span
                      className={`events-row__status ${
                        isPast
                          ? "events-row__status--past"
                          : event.registrationOpen
                            ? "events-row__status--open"
                            : "events-row__status--planned"
                      }`}
                    >
                      {statusText}
                    </span>
                  </div>

                  <div className="events-row__card">
                    <header className="events-row__head">
                      <h3>
                        <Link to={`/etkinlikler/${event.slug}`}>{event.title}</Link>
                      </h3>
                      {event.description && <p className="events-row__summary">{event.description}</p>}
                    </header>
                    <dl className="events-row__meta-grid">
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
                      <div>
                        <dt>Tarih</dt>
                        <dd>{dateLabel}</dd>
                      </div>
                    </dl>
                    <div className="events-row__actions">
                      <Link className="btn btn-ghost" to={`/etkinlikler/${event.slug}`}>
                        Detayları gör
                      </Link>
                      <Link className="btn btn-ghost" to={`/iletisim?konu=${encodeURIComponent(`Etkinlik: ${event.title}`)}`}>
                        Katılım Bilgisi Al
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
        </div>
      </div>
    </section>
  );
}

function shortDateParts(iso: string | null) {
  if (!iso) return { day: "—", month: "—", year: "—" };
  const d = new Date(iso);
  const formatter = new Intl.DateTimeFormat("tr-TR", { month: "long" });
  return {
    day: d.getDate().toString(),
    month: formatter.format(d),
    year: d.getFullYear().toString(),
  };
}

function EventsKpi({ value, label, suffix }: { value: number; label: string; suffix?: string }) {
  const reducedMotion = useReducedMotion();
  const ref = useCountUp(value, 1200, !reducedMotion);

  return (
    <div className="events-kpi">
      <strong className="mono events-kpi__value">
        <span ref={ref}>
          {String(value)}
          {suffix ?? ""}
        </span>
      </strong>
      <span className="events-kpi__label">{label}</span>
    </div>
  );
}

function useReducedMotion() {
  return useMemo(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    [],
  );
}
