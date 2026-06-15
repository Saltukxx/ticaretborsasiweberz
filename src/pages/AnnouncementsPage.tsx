import { useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import PageHero from "../components/PageHero";
import AnnouncementTicker from "../components/AnnouncementTicker";
import SeoHead from "../components/SeoHead";
import { useAnnouncementsPage } from "../hooks/usePublicApi";
import { htmlToPlainText } from "../lib/html";
import "./AnnouncementsPage.css";

const PAGE_SIZE = 12;

function pageHref(page: number): string {
  return page <= 1 ? "/duyurular" : `/duyurular?page=${page}`;
}

function AnnouncementsPagination({
  page,
  totalPages,
  total,
}: {
  page: number;
  totalPages: number;
  total: number;
}) {
  if (totalPages <= 1) return null;

  const rangeStart = (page - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(page * PAGE_SIZE, total);

  const pages: number[] = [];
  const windowSize = 5;
  let start = Math.max(1, page - Math.floor(windowSize / 2));
  let end = Math.min(totalPages, start + windowSize - 1);
  start = Math.max(1, end - windowSize + 1);
  for (let i = start; i <= end; i += 1) pages.push(i);

  return (
    <nav className="announcements__pagination" aria-label="Duyuru sayfaları">
      <p className="announcements__pagination-meta mono">
        {rangeStart}–{rangeEnd} / {total} duyuru
      </p>
      <div className="announcements__pagination-controls">
        {page > 1 ? (
          <Link className="announcements__pagination-btn" to={pageHref(page - 1)}>
            ← Önceki
          </Link>
        ) : (
          <span className="announcements__pagination-btn announcements__pagination-btn--disabled">← Önceki</span>
        )}
        <div className="announcements__pagination-pages">
          {pages.map((n) => (
            <Link
              key={n}
              className={`announcements__pagination-page${n === page ? " announcements__pagination-page--active" : ""}`}
              to={pageHref(n)}
              aria-current={n === page ? "page" : undefined}
            >
              {n}
            </Link>
          ))}
        </div>
        {page < totalPages ? (
          <Link className="announcements__pagination-btn" to={pageHref(page + 1)}>
            Sonraki →
          </Link>
        ) : (
          <span className="announcements__pagination-btn announcements__pagination-btn--disabled">Sonraki →</span>
        )}
      </div>
    </nav>
  );
}

export default function AnnouncementsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const rawPage = Number.parseInt(searchParams.get("page") ?? "1", 10);
  const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;
  const offset = (page - 1) * PAGE_SIZE;

  const { data, isLoading, isError } = useAnnouncementsPage(PAGE_SIZE, offset);
  const announcements = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  useEffect(() => {
    if (isLoading) return;
    if (totalPages > 0 && page > totalPages) {
      setSearchParams(totalPages <= 1 ? {} : { page: String(totalPages) }, { replace: true });
    }
  }, [isLoading, page, totalPages, setSearchParams]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [page]);

  return (
    <>
      <SeoHead
        title="Duyurular"
        description="Erzurum Ticaret Borsası kurumsal duyuru arşivi: üye işlemleri, bültenler ve resmi bildirimler."
        path="/duyurular"
      />
      <PageHero
        breadcrumb="Duyurular"
        eyebrow="Duyuru Merkezi · Kurumsal"
        title={<>Güncel <em>Duyurular</em></>}
        intro={
          total > 0
            ? `Kurumsal duyuru arşivinde ${total} içerik bulunuyor. Üye işlemleri, fiyat bültenleri ve resmi bildirimler.`
            : "Üye işlemleri, fiyat bültenleri, raporlar ve etkinliklere ilişkin tüm kurumsal duyurular."
        }
      />
      <AnnouncementTicker />
      <section className="announcements">
        <div className="container">
          {isLoading && (
            <p className="mono announcements__state">Duyurular yükleniyor…</p>
          )}
          {isError && (
            <p className="mono announcements__state">Duyurular yüklenemedi. Lütfen sayfayı yenileyin.</p>
          )}
          {!isLoading && !isError && announcements.length === 0 && (
            <p className="mono announcements__state">Henüz duyuru bulunmuyor.</p>
          )}
          <div className="announcements__grid">
            {announcements.map((a, i) => (
              <article className="announcement card" key={a.id}>
                <span className="announcement__num mono">
                  {String(offset + i + 1).padStart(2, "0")}
                </span>
                <div className="announcement__body">
                  <span className="announcement__date mono">
                    {a.publishedAt
                      ? new Date(a.publishedAt).toLocaleDateString("tr-TR", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })
                      : ""}
                  </span>
                  <h3>{a.title}</h3>
                  {a.body && <p>{htmlToPlainText(a.body)}</p>}
                  <Link className="btn-link" to={`/duyurular/${a.slug}`}>
                    Detayı Gör
                  </Link>
                </div>
              </article>
            ))}
          </div>
          {!isLoading && !isError && (
            <AnnouncementsPagination page={page} totalPages={totalPages} total={total} />
          )}
        </div>
      </section>
    </>
  );
}
