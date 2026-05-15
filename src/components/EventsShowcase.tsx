import type { CSSProperties } from "react";
import { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  countOpenRegistration,
  countStakeholderPrograms,
  plannedEvents,
  type PlannedEventStatus,
} from "../data/plannedEvents";
import { useCountUp, useReveal } from "../hooks/useReveal";
import "./EventsShowcase.css";

export default function EventsShowcase() {
  const boardRef = useReveal<HTMLDivElement>();
  const timelineRef = useReveal<HTMLDivElement>();

  const totalPrograms = plannedEvents.length;
  const openRegistrations = countOpenRegistration(plannedEvents);
  const stakeholderPrograms = countStakeholderPrograms(plannedEvents);

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
          </div>
          <div className="events-board__kpis" aria-label="Planlanan program özeti">
            <EventsKpi value={totalPrograms} label="Yaklaşan Program" suffix="" />
            <EventsKpi value={openRegistrations} label="Kayıt Açık" suffix="" />
            <EventsKpi value={stakeholderPrograms} label="Paydaş Odaklı Etkinlik" suffix="" />
          </div>
          <div className="events-board__stamp mono" aria-hidden="true">
            <span>Mayıs</span>
            <span aria-hidden="true">
              ·
            </span>
            <span>Haziran</span>
            <span aria-hidden="true">
              ·
            </span>
            <span>2026</span>
          </div>
        </div>

        <div className="events-timeline reveal" ref={timelineRef} aria-label="Planlanan etkinlikler listesi">
          {plannedEvents.map((event, index) => (
            <article
              key={event.id}
              className="events-row"
              id={`etkinlik-${event.id}`}
              style={{ "--delay": `${index * 0.08}s` } as CSSProperties}
            >
              <div className="events-row__rail">
                <span className="events-row__node" aria-hidden />
                <div className="events-row__date mono">
                  <span className="events-row__date-day">{shortDateParts(event.sortKey).day}</span>
                  <span className="events-row__date-meta">
                    <span>{shortDateParts(event.sortKey).month}</span>
                    <span>{shortDateParts(event.sortKey).year}</span>
                  </span>
                </div>
                <span className="events-row__category mono">{event.category}</span>
                <span className={`events-row__status events-row__status--${statusClass(event.status)}`}>
                  {event.status}
                </span>
              </div>

              <div className="events-row__card">
                <header className="events-row__head">
                  <h3>{event.title}</h3>
                  <p className="events-row__summary">{event.summary}</p>
                </header>
                <dl className="events-row__meta-grid">
                  <div>
                    <dt>Saat</dt>
                    <dd className="mono">{event.time}</dd>
                  </div>
                  <div>
                    <dt>Konum</dt>
                    <dd>{event.location}</dd>
                  </div>
                  <div className="events-row__meta-wide">
                    <dt>Hedef Kitle</dt>
                    <dd>{event.audience}</dd>
                  </div>
                  <div>
                    <dt>Tarih</dt>
                    <dd>{event.dateLabel}</dd>
                  </div>
                </dl>
                <ul className="events-row__details" id={`detay-${event.id}`}>
                  {event.details.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
                <div className="events-row__actions">
                  <a className="btn-link" href={`#detay-${event.id}`}>
                    Detayları İncele
                  </a>
                  <Link className="btn btn-ghost" to="/iletisim">
                    Katılım Bilgisi Al
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function shortDateParts(isoDate: string) {
  const d = new Date(`${isoDate}T12:00:00`);
  const formatter = new Intl.DateTimeFormat("tr-TR", { month: "long" });
  return {
    day: d.getDate().toString(),
    month: formatter.format(d),
    year: d.getFullYear().toString(),
  };
}

function statusClass(status: PlannedEventStatus) {
  switch (status) {
    case "Kayıt Açık":
      return "open";
    case "Kontenjan Sınırlı":
      return "limited";
    case "Planlandı":
      return "planned";
    default: {
      const x: never = status;
      return x;
    }
  }
}

function EventsKpi({ value, label, suffix }: { value: number; label: string; suffix?: string }) {
  const reducedMotion = useReducedMotion();
  const ref = useCountUp(value, 1200, !reducedMotion);

  return (
    <div className="events-kpi">
      <strong className="mono events-kpi__value">
        <span ref={ref}>{String(value)}{suffix ?? ""}</span>
      </strong>
      <span className="events-kpi__label">{label}</span>
    </div>
  );
}

function useReducedMotion() {
  return useMemo(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    []
  );
}
