import { announcements } from "../data/market";
import "./AnnouncementTicker.css";

export default function AnnouncementTicker() {
  const list = [...announcements, ...announcements];
  return (
    <section className="ann">
      <div className="container ann__inner">
        <div className="ann__label">
          <span className="ann__dot" />
          <span className="mono">Güncel Duyurular</span>
        </div>
        <div className="ann__viewport">
          <div className="ann__track">
            {list.map((t, i) => (
              <span className="ann__item" key={i}>
                <span className="ann__marker mono">{String((i % announcements.length) + 1).padStart(2, "0")}</span>
                {t}
                <span className="ann__sep">◆</span>
              </span>
            ))}
          </div>
        </div>
        <a className="ann__cta mono" href="/duyurular">Tüm Duyurular →</a>
      </div>
    </section>
  );
}
