import { useAnnouncementsTicker } from "../hooks/usePublicApi";
import "./AnnouncementTicker.css";

export default function AnnouncementTicker() {
  const { data, isLoading, isError } = useAnnouncementsTicker();

  // Fall back to hidden strip on error; show placeholder on loading
  if (isError || (!isLoading && (!data || data.length === 0))) return null;

  const items = data ?? [];
  // Duplicate for seamless scroll animation
  const list = items.length > 0 ? [...items, ...items] : [];

  return (
    <section className="ann">
      <div className="container ann__inner">
        <div className="ann__label">
          <span className="ann__dot" />
          <span className="mono">Güncel Duyurular</span>
        </div>
        <div className="ann__viewport">
          <div className="ann__track">
            {isLoading ? (
              <span className="ann__item">
                <span className="ann__marker mono">…</span>
                Duyurular yükleniyor
              </span>
            ) : (
              list.map((item, i) => (
                <span className="ann__item" key={`${item.id}-${i}`}>
                  <span className="ann__marker mono">
                    {String((i % items.length) + 1).padStart(2, "0")}
                  </span>
                  {item.title}
                  <span className="ann__sep">◆</span>
                </span>
              ))
            )}
          </div>
        </div>
        <a className="ann__cta mono" href="/duyurular">Tüm Duyurular →</a>
      </div>
    </section>
  );
}
