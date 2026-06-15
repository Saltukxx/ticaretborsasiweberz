import { Link } from "react-router-dom";
import { EventsPreviewCard } from "./EventsPreview";
import { useCorporate, usePublicEvents } from "../hooks/usePublicApi";
import { formatDisplayHeading } from "../lib/formatDisplayHeading";
import { useReveal } from "../hooks/useReveal";
import "./HomeSections.css";
import "./EventsShowcase.css";
import "./HomeCorporateClosing.css";

export default function HomeCorporateClosing() {
  const corpRef = useReveal<HTMLDivElement>();
  const eventsRef = useReveal<HTMLDivElement>();
  const { data, isLoading, isError } = useCorporate();
  const { data: eventsData } = usePublicEvents(3, "upcoming");
  const events = eventsData ?? [];

  const profile = data?.profile;
  const { lead: headingLead, emphasis: headingEmphasis } = formatDisplayHeading(profile?.heading);

  const intro = isLoading
    ? "Kurumsal içerik yükleniyor…"
    : isError
      ? "Misyon, vizyon ve tarihçe — kurumsal sayfada ayrıntılı bilgi."
      : profile?.lead ??
        "Misyon, vizyon, tarihçe ve bölgesel ekonomiye katkı — kurumsal kimlik ve yönetişim çerçevesi ayrı sayfada ayrıntılı sunulur.";

  return (
    <section className="home-closing" aria-labelledby="home-closing-events-title">
      <div className="container">
        <div className="hsec-corp__band card reveal" ref={corpRef}>
          <div className="hsec-corp__text">
            <span className="eyebrow">{profile?.eyebrow ?? "Kurumsal · 1946'dan Beri"}</span>
            <h2>
              {headingEmphasis ? (
                <>
                  {headingLead} ile <em>tanışın</em>
                </>
              ) : (
                <>{headingLead} ile tanışın</>
              )}
            </h2>
            <p>{intro}</p>
          </div>
          <div className="hsec-corp__actions">
            <Link className="btn btn-primary" to="/kurumsal">
              Kurumsal bilgi al
            </Link>
            <Link className="btn btn-ghost" to="/iletisim">
              İletişim
            </Link>
          </div>
        </div>

        <header className="home-closing__events-head section-title reveal" ref={eventsRef}>
          <div>
            <span className="eyebrow">Kurumsal Takvim</span>
            <h2 id="home-closing-events-title">Yaklaşan etkinliklere göz atın</h2>
            <p>
              Toplantılar, eğitimler ve saha buluşmaları ile borsanın sahadaki ritmini takip edin.
            </p>
          </div>
          <Link className="btn-link home-closing__events-cta" to="/etkinlikler">
            Tüm etkinlikleri aç
          </Link>
        </header>

        {events.length > 0 ? (
          <div className="events-preview__grid">
            {events.map((event) => (
              <EventsPreviewCard key={event.id} event={event} showProjectNote={false} />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
