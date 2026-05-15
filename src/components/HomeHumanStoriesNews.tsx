import { Link } from "react-router-dom";
import { currencies, news, type NewsItem } from "../data/market";
import { useReveal } from "../hooks/useReveal";
import "./HomeHumanStoriesNews.css";

const storyImages = [
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

const storyLabels = ["Üretici gündemi", "Tüccar gündemi", "Kurumsal gündem"] as const;

type StoryCard = NewsItem & {
  image: (typeof storyImages)[number];
  storyLabel: string;
};

export default function HomeHumanStoriesNews() {
  const headRef = useReveal<HTMLDivElement>();
  const stageRef = useReveal<HTMLDivElement>();
  const featured = news.find((item) => item.big) ?? news[0];
  const storyCards: StoryCard[] = news
    .filter((item) => item.id !== featured.id)
    .slice(0, 3)
    .map((item, index) => ({
      ...item,
      image: storyImages[(index + 1) % storyImages.length],
      storyLabel: storyLabels[index] ?? "Borsa gündemi",
    }));
  const tickerItems = [...news, ...news];
  const marketItems = [...currencies, ...currencies];

  return (
    <section className="hnews" aria-labelledby="hnews-title">
      <div className="container">
        <div className="hnews__head section-title reveal" ref={headRef}>
          <div>
            <span className="eyebrow">Haberler · Saha ve Bölge</span>
            <h2 id="hnews-title">
              Borsadan haberler
            </h2>
          </div>
          <p>Kurumsal gündemi, toplantıları ve üyelerle temasları veri kalabalığına boğmadan; gerçek fotoğraflar ve güçlü başlıklarla izleyin.</p>
        </div>

        <div className="hnews__stage reveal" ref={stageRef}>
          <article className="hnews__feature">
            <Link to="/haberler" className="hnews__feature-link" aria-label={`${featured.title} haberini oku`}>
              <div className="hnews__feature-media">
                <img src={storyImages[0].src} alt={storyImages[0].alt} loading="lazy" decoding="async" />
                <span className="hnews__photo-label mono">{storyImages[0].label}</span>
              </div>
              <div className="hnews__feature-body">
                <div className="hnews__meta mono">
                  <span>{featured.category}</span>
                  <span>{featured.date}</span>
                </div>
                <h3>{featured.title}</h3>
                <p>{featured.excerpt}</p>
                <span className="hnews__read mono">Haberi oku</span>
              </div>
            </Link>
          </article>

          <aside className="hnews__side" aria-label="Öne çıkan haber hikayeleri">
            {storyCards.map((item, index) => (
              <Link className="hnews__story" to="/haberler" key={item.id}>
                <span className="hnews__story-index mono">{String(index + 1).padStart(2, "0")}</span>
                <div className="hnews__story-media">
                  <img src={item.image.src} alt={item.image.alt} loading="lazy" decoding="async" />
                </div>
                <div className="hnews__story-body">
                  <div className="hnews__story-meta mono">
                    <span>{item.storyLabel}</span>
                    <span>{item.date}</span>
                  </div>
                  <h3>{item.title}</h3>
                  <p>{item.excerpt}</p>
                </div>
                <span className="hnews__story-arrow" aria-hidden="true">→</span>
              </Link>
            ))}
          </aside>
        </div>

        <div className="hnews__pulse-dock">
          <div className="hnews__ticker" aria-label="Haber gündemi">
            <span className="hnews__ticker-label mono">
              <span className="hnews__ticker-dot" aria-hidden="true" />
              Gündem çizgisi
            </span>
            <div className="hnews__ticker-viewport">
              <div className="hnews__ticker-track">
                {tickerItems.map((item, index) => (
                  <span className="hnews__ticker-item" key={`${item.id}-${index}`}>
                    <span className="hnews__ticker-cat mono">{item.category}</span>
                    {item.title}
                  </span>
                ))}
              </div>
            </div>
            <Link className="btn-link" to="/haberler">
              Tüm haberleri aç
            </Link>
          </div>

          <div className="hnews__market" aria-label="Canlı piyasa özeti">
            <span className="hnews__market-label mono">
              <span className="hnews__market-dot" aria-hidden="true" />
              Canlı Piyasa
            </span>
            <div className="hnews__market-viewport">
              <div className="hnews__market-track">
                {marketItems.map((item, index) => (
                  <span className="hnews__market-item" key={`${item.code}-${index}`}>
                    <span className="hnews__market-code mono">{item.code}</span>
                    <strong className="mono tabular">{item.value}</strong>
                    <span className={`hnews__market-change mono ${item.up ? "is-up" : "is-down"}`}>
                      {item.up ? "▲" : "▼"} {item.change}
                    </span>
                  </span>
                ))}
              </div>
            </div>
            <span className="hnews__market-time mono">
              {new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
