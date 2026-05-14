import { Link } from "react-router-dom";
import { news, type NewsItem } from "../data/market";
import { useReveal } from "../hooks/useReveal";
import "./NewsEditorial.css";

const editorialImages = [
  {
    src: "/images/haber-kurumsal-ziyaret.png",
    alt: "Erzurum Ticaret Borsası kurumsal ziyaret görüşmesi",
    label: "Kurumsal ziyaret",
  },
  {
    src: "/images/haber-meclis-toplantisi.png",
    alt: "Erzurum Ticaret Borsası toplantı salonunda meclis gündemi",
    label: "Meclis gündemi",
  },
  {
    src: "/images/haber-uye-bulusmasi.png",
    alt: "Erzurum Ticaret Borsası üye buluşması",
    label: "Üye buluşması",
  },
] as const;

const storyContexts = ["Saha gündemi", "Üye teması", "Kurumsal buluşma", "Bölgesel etki", "Sektör notu"] as const;

type EditorialStory = NewsItem & {
  image: (typeof editorialImages)[number];
  context: string;
};

export default function NewsEditorial() {
  const headRef = useReveal<HTMLDivElement>();
  const leadRef = useReveal<HTMLDivElement>();
  const gridRef = useReveal<HTMLDivElement>();
  const stories: EditorialStory[] = news.map((item, index) => ({
    ...item,
    image: editorialImages[index % editorialImages.length],
    context: storyContexts[index % storyContexts.length],
  }));
  const featured = stories.find((item) => item.big) ?? stories[0];
  const rest = stories.filter((item) => item.id !== featured.id);
  const highlighted = rest.slice(0, 2);
  const strip = [...news, ...news];

  return (
    <section className="news">
      <div className="container">
        <div className="section-title reveal" ref={headRef}>
          <div>
            <span className="eyebrow">Haberler · İnsan ve Bölge</span>
            <h2>
              Borsadan <em className="news__title-em">saha hikayeleri</em>
            </h2>
          </div>
          <p>
            Kurumsal gündem, toplantılar ve üye temasları; gerçek fotoğraflar,
            güçlü başlıklar ve okunabilir bir editoryal akışla sunulur.
          </p>
        </div>

        <div className="news__lead-grid reveal" ref={leadRef}>
          <article className="news__featured">
            <Link className="news__featured-link" to="/haberler" aria-label={`${featured.title} haberini oku`}>
              <div className="news__featured-media">
                <img src={featured.image.src} alt={featured.image.alt} loading="lazy" decoding="async" />
                <span className="news__featured-cat mono">{featured.category}</span>
                <span className="news__featured-date mono">{featured.date}</span>
                <span className="news__featured-photo mono">{featured.image.label}</span>
              </div>
              <div className="news__featured-body">
                <span className="news__context mono">{featured.context}</span>
                <h3>{featured.title}</h3>
                <p>{featured.excerpt}</p>
                <span className="btn-link">Haberi Oku</span>
              </div>
            </Link>
          </article>

          <aside className="news__brief" aria-label="Haber odası özeti">
            <span className="eyebrow">Editoryal Akış</span>
            <h3>Sadece başlık değil, kurumun sahadaki izi.</h3>
            <p>
              Erzurum Ticaret Borsası gündemi; ziyaretler, toplantılar, üye
              buluşmaları ve sektörel değerlendirmeler üzerinden daha insani ve
              okunabilir bir düzende aktarılır.
            </p>
            <div className="news__brief-list">
              {highlighted.map((item) => (
                <Link to="/haberler" className="news__brief-item" key={item.id}>
                  <span className="mono">{item.context}</span>
                  <strong>{item.title}</strong>
                </Link>
              ))}
            </div>
          </aside>
        </div>

        <div className="news__timeline reveal" ref={gridRef} aria-label="Editoryal haber zaman tüneli">
          <div className="news__timeline-head">
            <span className="eyebrow">Zaman Tüneli</span>
            <h3>
              Kurum gündemi <em>sahadan</em> akıyor.
            </h3>
            <p>Ziyaretler, toplantılar ve üye temasları tarih sırasına yakın, okunması kolay bir hikaye akışında sergilenir.</p>
          </div>

          <div className="news__timeline-list">
            {rest.map((item, index) => (
              <Link
                className={`news__timeline-item ${index % 2 === 1 ? "news__timeline-item--offset" : ""}`}
                to="/haberler"
                key={item.id}
              >
                <span className="news__timeline-node mono">
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <strong>{item.date}</strong>
                </span>
                <div className="news__timeline-media">
                  <img src={item.image.src} alt={item.image.alt} loading="lazy" decoding="async" />
                  <span className="news__story-kicker mono">{item.image.label}</span>
                </div>
                <div className="news__timeline-copy">
                  <div className="news__item-meta mono">
                    <span className={`news__chip news__chip--${item.tone}`}>{item.category}</span>
                    <span>{item.context}</span>
                  </div>
                  <h4>{item.title}</h4>
                  <p>{item.excerpt}</p>
                </div>
                <span className="news__timeline-arrow" aria-hidden>→</span>
              </Link>
            ))}
          </div>
        </div>

        <div className="news__strip" aria-label="Son haberler şeridi">
          <span className="news__strip-label mono">
            <span className="news__strip-dot" />
            Gündem çizgisi
          </span>
          <div className="news__strip-viewport">
            <div className="news__strip-track">
              {strip.map((item, index) => (
                <span className="news__strip-item" key={`${item.id}-${index}`}>
                  <span className="news__strip-cat mono">{item.category}</span>
                  {item.title}
                  <span className="news__strip-sep">◆</span>
                </span>
              ))}
            </div>
          </div>
          <Link className="btn-link" to="/haberler">Tümünü Gör</Link>
        </div>
      </div>
    </section>
  );
}
