import PageHero from "../components/PageHero";
import AnnouncementTicker from "../components/AnnouncementTicker";
import { announcements } from "../data/market";
import "./AnnouncementsPage.css";

export default function AnnouncementsPage() {
  return (
    <>
      <PageHero
        breadcrumb="Duyurular"
        eyebrow="Duyuru Merkezi · Kurumsal"
        title={<>Güncel <em>Duyurular</em></>}
        intro="Üye işlemleri, fiyat bültenleri, raporlar ve etkinliklere ilişkin tüm kurumsal duyurular."
      />
      <AnnouncementTicker />
      <section className="announcements">
        <div className="container">
          <div className="announcements__grid">
            {[...announcements, ...announcements].map((a, i) => (
              <article className="announcement card" key={i}>
                <span className="announcement__num mono">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="announcement__body">
                  <span className="announcement__date mono">12 Mayıs 2026</span>
                  <h3>{a}</h3>
                  <p>
                    Üyelerimize duyurulur. Detaylı bilgi ve başvuru formları kurumsal portal
                    üzerinden erişilebilir.
                  </p>
                  <a className="btn-link" href="#">Detayı Gör</a>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
