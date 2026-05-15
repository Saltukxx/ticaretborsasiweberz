import { Link } from "react-router-dom";
import type { PlannedEvent } from "../data/plannedEvents";
import { getUpcomingEvents } from "../data/plannedEvents";
import "./EventsShowcase.css";

type PreviewVariant = "home" | "projects";

interface Props {
  variant: PreviewVariant;
}

export default function EventsPreview({ variant }: Props) {
  const events = getUpcomingEvents(3);
  const isProjects = variant === "projects";

  return (
    <section
      className={`events-preview ${isProjects ? "events-preview--projects" : "events-preview--home"}`}
      aria-labelledby={isProjects ? "evprev-projects-title" : "evprev-home-title"}
    >
      <div className="container">
        <header className="events-preview__head">
          <div>
            <span className="eyebrow">{isProjects ? "Proje Süreçleri" : "Kurumsal Takvim"}</span>
            <h2 id={isProjects ? "evprev-projects-title" : "evprev-home-title"}>
              {isProjects ? (
                <>
                  Yaklaşan programlar · <em>projeler ve paydaş buluşmaları</em>
                </>
              ) : (
                <>
                  Yaklaşan etkinliklere göz atın
                </>
              )}
            </h2>
            {!isProjects && (
              <p className="events-preview__intro">
                Toplantılar, eğitimler ve saha buluşmaları ile borsanın sahadaki ritmini takip edin.
              </p>
            )}
            {isProjects && (
              <p className="events-preview__intro">
                Bazı yaklaşan etkinlikler proje çıktılarının yaygınlaştırılmasıyla doğrudan ilişkilidir.
              </p>
            )}
          </div>
          <Link className="btn-link" to="/etkinlikler">
            Tüm etkinlikleri aç
          </Link>
        </header>

        <div className="events-preview__grid">
          {events.map((event) => (
            <EventsPreviewCard key={event.id} event={event} showProjectNote={isProjects} />
          ))}
        </div>
      </div>
    </section>
  );
}

function EventsPreviewCard({ event, showProjectNote }: { event: PlannedEvent; showProjectNote: boolean }) {
  const badge = badgeFromDate(event.sortKey);

  return (
    <article className="events-preview__card">
      <div className="events-preview__badge mono" aria-hidden>
        <span className="events-preview__badge-day">{badge.day}</span>
        <span className="events-preview__badge-rest">
          <span>{badge.monthShort}</span>
          <span>{badge.year}</span>
        </span>
      </div>
      <div className="events-preview__body">
        <span className="events-preview__cat mono">{event.category}</span>
        <h3>{event.title}</h3>
        <p className="events-preview__when mono">
          {event.dateLabel} · {event.time}
        </p>
        <p className="events-preview__loc">{event.location}</p>
        {showProjectNote && event.projectNote ? (
          <p className="events-preview__note">{event.projectNote}</p>
        ) : (
          <p className="events-preview__snippet">{event.summary}</p>
        )}
      </div>
    </article>
  );
}

function badgeFromDate(isoDate: string) {
  const d = new Date(`${isoDate}T12:00:00`);
  const day = new Intl.DateTimeFormat("tr-TR", { day: "numeric" }).format(d);
  const month = new Intl.DateTimeFormat("tr-TR", { month: "short" }).format(d);
  const year = new Intl.DateTimeFormat("tr-TR", { year: "numeric" }).format(d);
  return { day, monthShort: month, year };
}
