import { useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { PUBLIC_NEWS_LIST_KEY } from "../hooks/usePublicApi";
import { fetchNewsListPage, fetchNewsList, type PublicNewsItem } from "../lib/publicApi";
import { newsStoryImage } from "../lib/newsStoryImage";
import { revealClass } from "../lib/revealClass";
import { useReveal } from "../hooks/useReveal";
import "./NewsEditorial.css";

const storyContexts = ["Saha gündemi", "Üye teması", "Kurumsal buluşma", "Bölgesel etki", "Sektör notu"] as const;
const DEFAULT_PAGE_SIZE = 12;

function formatDate(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
}

type EditorialStory = PublicNewsItem & {
  image: ReturnType<typeof newsStoryImage>;
  context: string;
};

function storyImage(item: PublicNewsItem, index: number) {
  return newsStoryImage(item, index);
}

function pageHref(page: number): string {
  return page <= 1 ? "/haberler" : `/haberler?page=${page}`;
}

type NewsPaginationProps = {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
};

function NewsPagination({ page, totalPages, total, pageSize }: NewsPaginationProps) {
  if (totalPages <= 1) return null;

  const rangeStart = (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, total);

  const pages: number[] = [];
  const windowSize = 5;
  let start = Math.max(1, page - Math.floor(windowSize / 2));
  let end = Math.min(totalPages, start + windowSize - 1);
  start = Math.max(1, end - windowSize + 1);
  for (let i = start; i <= end; i += 1) pages.push(i);

  return (
    <nav className="news__pagination" aria-label="Haber sayfaları">
      <p className="news__pagination-meta mono">
        {rangeStart}–{rangeEnd} / {total} haber
      </p>
      <div className="news__pagination-controls">
        {page > 1 ? (
          <Link className="news__pagination-btn" to={pageHref(page - 1)} aria-label="Önceki sayfa">
            ← Önceki
          </Link>
        ) : (
          <span className="news__pagination-btn news__pagination-btn--disabled" aria-hidden>
            ← Önceki
          </span>
        )}

        <div className="news__pagination-pages">
          {start > 1 && (
            <>
              <Link className="news__pagination-page" to={pageHref(1)}>
                1
              </Link>
              {start > 2 && <span className="news__pagination-ellipsis">…</span>}
            </>
          )}
          {pages.map((n) => (
            <Link
              key={n}
              className={`news__pagination-page${n === page ? " news__pagination-page--active" : ""}`}
              to={pageHref(n)}
              aria-current={n === page ? "page" : undefined}
            >
              {n}
            </Link>
          ))}
          {end < totalPages && (
            <>
              {end < totalPages - 1 && <span className="news__pagination-ellipsis">…</span>}
              <Link className="news__pagination-page" to={pageHref(totalPages)}>
                {totalPages}
              </Link>
            </>
          )}
        </div>

        {page < totalPages ? (
          <Link className="news__pagination-btn" to={pageHref(page + 1)} aria-label="Sonraki sayfa">
            Sonraki →
          </Link>
        ) : (
          <span className="news__pagination-btn news__pagination-btn--disabled" aria-hidden>
            Sonraki →
          </span>
        )}
      </div>
    </nav>
  );
}

type NewsEditorialProps = {
  paginated?: boolean;
  pageSize?: number;
};

export default function NewsEditorial({ paginated = false, pageSize = DEFAULT_PAGE_SIZE }: NewsEditorialProps) {
  const headRef = useReveal<HTMLDivElement>();
  const leadRef = useReveal<HTMLDivElement>();
  const gridRef = useReveal<HTMLDivElement>();
  const [searchParams, setSearchParams] = useSearchParams();

  const rawPage = Number.parseInt(searchParams.get("page") ?? "1", 10);
  const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;
  const offset = (page - 1) * pageSize;

  const archiveQuery = useQuery({
    queryKey: ["public", "news", "list", pageSize, offset] as const,
    queryFn: () => fetchNewsListPage(pageSize, offset),
    enabled: paginated,
    staleTime: 120_000,
  });

  const previewQuery = useQuery({
    queryKey: PUBLIC_NEWS_LIST_KEY(pageSize),
    queryFn: () => fetchNewsList(pageSize, 0),
    enabled: !paginated,
    staleTime: 120_000,
  });

  const isLoading = paginated ? archiveQuery.isLoading : previewQuery.isLoading;
  const isSuccess = paginated ? archiveQuery.isSuccess : previewQuery.isSuccess;
  const isError = paginated ? archiveQuery.isError : previewQuery.isError;
  const newsItems = paginated
    ? (archiveQuery.data?.items ?? [])
    : (previewQuery.data ?? []);
  const total = paginated ? (archiveQuery.data?.total ?? 0) : newsItems.length;
  const totalPages = paginated ? Math.max(1, Math.ceil(total / pageSize)) : 1;

  useEffect(() => {
    if (!paginated || archiveQuery.isLoading) return;
    if (totalPages > 0 && page > totalPages) {
      setSearchParams(totalPages <= 1 ? {} : { page: String(totalPages) }, { replace: true });
    }
  }, [paginated, page, totalPages, archiveQuery.isLoading, setSearchParams]);

  useEffect(() => {
    if (!paginated) return;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [paginated, page]);

  const stories: EditorialStory[] = newsItems.map((item, index) => ({
    ...item,
    image: storyImage(item, index),
    context: storyContexts[index % storyContexts.length],
  }));

  const showFeaturedLayout = !paginated || page === 1;
  const featured = showFeaturedLayout
    ? (stories.find((item) => item.isFeatured) ?? stories[0])
    : null;
  const contentReady = !isLoading && stories.length > 0;

  if (isLoading) {
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
          </div>
          <p className="mono news__loading">Haberler yükleniyor…</p>
        </div>
      </section>
    );
  }

  if (!isLoading && (isError || (isSuccess && stories.length === 0))) {
    return (
      <section className="news">
        <div className="container">
          <p className="mono news__empty">
            {isError
              ? "Haberler yüklenemedi. Lütfen sayfayı yenileyin."
              : "Henüz yayımlanmış haber bulunmuyor."}
          </p>
        </div>
      </section>
    );
  }

  const timelineItems = showFeaturedLayout && featured
    ? stories.filter((item) => item.id !== featured.id)
    : stories;
  const highlighted = showFeaturedLayout && featured
    ? stories.filter((item) => item.id !== featured.id).slice(0, 2)
    : [];
  const strip = paginated ? newsItems : [...newsItems, ...newsItems];

  return (
    <section className="news">
      <div className="container">
        <div className={`section-title ${revealClass(contentReady)}`} ref={headRef}>
          <div>
            <span className="eyebrow">Haberler · İnsan ve Bölge</span>
            <h2>
              Borsadan <em className="news__title-em">saha hikayeleri</em>
            </h2>
          </div>
          <p>
            {paginated && total > 0 ? (
              <>
                Kurumsal haber arşivinde <strong>{total}</strong> içerik bulunuyor.
                {totalPages > 1 && <> Sayfa {page} / {totalPages}.</>}
              </>
            ) : (
              <>
                Kurumsal gündem, toplantılar ve üye temasları; gerçek fotoğraflar,
                güçlü başlıklar ve okunabilir bir editoryal akışla sunulur.
              </>
            )}
          </p>
        </div>

        {showFeaturedLayout && featured && (
          <div className={`news__lead-grid ${revealClass(contentReady)}`} ref={leadRef}>
            <article className="news__featured">
              <Link
                className="news__featured-link"
                to={`/haberler/${featured.slug}`}
                aria-label={`${featured.title} haberini oku`}
              >
                <div className="news__featured-media">
                  <img src={featured.image.src} alt={featured.image.alt} loading="lazy" decoding="async" />
                  <span className="news__featured-cat mono">{featured.category}</span>
                  <span className="news__featured-date mono">{formatDate(featured.publishedAt)}</span>
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
                  <Link to={`/haberler/${item.slug}`} className="news__brief-item" key={item.id}>
                    <span className="mono">{item.context}</span>
                    <strong>{item.title}</strong>
                  </Link>
                ))}
              </div>
            </aside>
          </div>
        )}

        <div className={`news__timeline ${revealClass(contentReady)}`} ref={gridRef} aria-label="Editoryal haber zaman tüneli">
          <div className="news__timeline-head">
            <span className="eyebrow">{paginated && page > 1 ? "Arşiv" : "Zaman Tüneli"}</span>
            <h3>
              {paginated && page > 1 ? (
                <>Haber arşivi · <em>sayfa {page}</em></>
              ) : (
                <>Kurum gündemi <em>sahadan</em> akıyor.</>
              )}
            </h3>
            <p>
              {paginated && page > 1
                ? "Yayın tarihine göre sıralanmış haberler. Detay için başlığa tıklayın."
                : "Ziyaretler, toplantılar ve üye temasları tarih sırasına yakın, okunması kolay bir hikaye akışında sergilenir."}
            </p>
          </div>

          <div className="news__timeline-list">
            {timelineItems.map((item, index) => (
              <Link
                className={`news__timeline-item ${index % 2 === 1 ? "news__timeline-item--offset" : ""}`}
                to={`/haberler/${item.slug}`}
                key={item.id}
              >
                <span className="news__timeline-node mono">
                  <span>{String(offset + index + (showFeaturedLayout && featured ? 2 : 1)).padStart(2, "0")}</span>
                  <strong>{formatDate(item.publishedAt)}</strong>
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

        {paginated && (
          <NewsPagination
            page={page}
            totalPages={totalPages}
            total={total}
            pageSize={pageSize}
          />
        )}

        {!paginated && strip.length > 0 && (
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
        )}
      </div>
    </section>
  );
}
