import { Link } from "react-router-dom";
import { usePublicEvents } from "../hooks/usePublicApi";
import type { PublicEvent } from "../lib/publicApi";
import "./EventsShowcase.css";

type PreviewVariant = "home" | "projects";

interface Props {
  variant: PreviewVariant;
}

export default function EventsPreview({ variant }: Props) {
  const { data } = usePublicEvents(3, "upcoming");
  const events = data ?? [];
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

function badgeFromDate(iso: string | null) {
  if (!iso) return { day: "—", monthShort: "—", year: "—" };
  const d = new Date(iso);
  return {
    day: new Intl.DateTimeFormat("tr-TR", { day: "numeric" }).format(d),
    monthShort: new Intl.DateTimeFormat("tr-TR", { month: "short" }).format(d),
    year: new Intl.DateTimeFormat("tr-TR", { year: "numeric" }).format(d),
  };
}

export function EventsPreviewCard({ event, showProjectNote: _showProjectNote }: { event: PublicEvent; showProjectNote: boolean }) {
  const badge = badgeFromDate(event.startsAt);
  const timeStr = event.startsAt
    ? new Date(event.startsAt).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })
    : "";
  const dateLabel = event.startsAt
    ? new Date(event.startsAt).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })
    : "";

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
        <span
          className={`events-row__status ${event.registrationOpen ? "events-row__status--open" : "events-row__status--planned"}`}
        >
          {event.statusLabel?.trim() ||
            (event.registrationOpen ? "Kayıt açık" : "Planlandı")}
        </span>
        <h3>{event.title}</h3>
        <p className="events-preview__when mono">
          {dateLabel}{timeStr ? ` · ${timeStr}` : ""}
        </p>
        {event.location && <p className="events-preview__loc">{event.location}</p>}
        {event.description && <p className="events-preview__snippet">{event.description}</p>}
      </div>
    </article>
  );
}
