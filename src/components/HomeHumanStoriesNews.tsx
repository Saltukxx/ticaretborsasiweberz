import { Link } from "react-router-dom";
import { useNewsList } from "../hooks/usePublicApi";
import type { PublicNewsItem } from "../lib/publicApi";
import { HOME_PULSE_NEWS_LIMIT } from "../lib/prefetchHomePulse";
import { newsStoryImage } from "../lib/newsStoryImage";
import { revealClass } from "../lib/revealClass";
import { useReveal } from "../hooks/useReveal";
import "./HomeHumanStoriesNews.css";

const storyLabels = ["Üretici gündemi", "Tüccar gündemi", "Kurumsal gündem"] as const;

function formatDate(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
}

type StoryCard = PublicNewsItem & {
  image: ReturnType<typeof newsStoryImage>;
  storyLabel: string;
};

export default function HomeHumanStoriesNews() {
  const headRef = useReveal<HTMLDivElement>();

  const { data: newsData, isLoading, isError, isFetched } = useNewsList(HOME_PULSE_NEWS_LIMIT);
  const newsItems = newsData ?? [];
  const contentReady = newsItems.length > 0;

  if (isFetched && !isLoading && !isError && newsItems.length === 0) {
    return null;
  }

  const featured = newsItems.find((item) => item.isFeatured) ?? newsItems[0];
  const featuredImage = featured ? newsStoryImage(featured, 0) : null;
  const storyCards: StoryCard[] = featured
    ? newsItems
        .filter((item) => item.id !== featured.id)
        .slice(0, 3)
        .map((item, index) => ({
          ...item,
          image: newsStoryImage(item, index + 1),
          storyLabel: storyLabels[index] ?? "Borsa gündemi",
        }))
    : [];

  return (
    <section className="hnews" aria-labelledby="hnews-title">
      <div className="container">
        <div className={`hnews__head section-title ${revealClass(true)}`} ref={headRef}>
          <div>
            <span className="eyebrow">Haberler · Saha ve Bölge</span>
            <h2 id="hnews-title">
              Borsadan haberler
            </h2>
          </div>
        </div>

        {isLoading && !contentReady && (
          <p className="mono hnews__loading">Haberler yükleniyor…</p>
        )}

        {isError && !contentReady && (
          <p className="mono hnews__loading">Haberler yüklenemedi.</p>
        )}

        {featured && featuredImage && (
          <div className={`hnews__stage ${revealClass(contentReady)}`}>
            <article className="hnews__feature">
              <Link
                to={`/haberler/${featured.slug}`}
                className="hnews__feature-link"
                aria-label={`${featured.title} haberini oku`}
              >
                <div className="hnews__feature-media">
                  <img src={featuredImage.src} alt={featuredImage.alt} loading="lazy" decoding="async" />
                  <span className="hnews__photo-label mono">{featuredImage.label}</span>
                </div>
                <div className="hnews__feature-body">
                  <div className="hnews__meta mono">
                    <span>{featured.category}</span>
                    <span>{formatDate(featured.publishedAt)}</span>
                  </div>
                  <h3>{featured.title}</h3>
                  <p>{featured.excerpt}</p>
                  <span className="hnews__read mono">Haberi oku</span>
                </div>
              </Link>
            </article>

            <aside className="hnews__side" aria-label="Öne çıkan haber hikayeleri">
              {storyCards.map((item, index) => (
                <Link className="hnews__story" to={`/haberler/${item.slug}`} key={item.id}>
                  <span className="hnews__story-index mono">{String(index + 1).padStart(2, "0")}</span>
                  <div className="hnews__story-media">
                    <img src={item.image.src} alt={item.image.alt} loading="lazy" decoding="async" />
                  </div>
                  <div className="hnews__story-body">
                    <div className="hnews__story-meta mono">
                      <span>{item.storyLabel}</span>
                      <span>{formatDate(item.publishedAt)}</span>
                    </div>
                    <h3>{item.title}</h3>
                    <p>{item.excerpt}</p>
                  </div>
                  <span className="hnews__story-arrow" aria-hidden="true">→</span>
                </Link>
              ))}
            </aside>
          </div>
        )}
      </div>
    </section>
  );
}
