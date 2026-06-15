import type { CSSProperties } from "react";
import { Link } from "react-router-dom";
import { useNewsList } from "../hooks/usePublicApi";
import { HOME_PULSE_NEWS_LIMIT } from "../lib/prefetchHomePulse";
import { marqueeDuration, marqueeHalfLength, marqueeLoop } from "../lib/marqueeLoop";
import "./HomePulseMarquee.css";

export default function HomeAgendaMarquee() {
  const { data, isLoading, isError, isFetched } = useNewsList(HOME_PULSE_NEWS_LIMIT);
  const news = data ?? [];

  if (isError || (isFetched && news.length === 0)) return null;

  const loop = news.length > 0 ? marqueeLoop(news) : [];
  const trackStyle = loop.length
    ? ({
        "--pulse-duration": `${marqueeDuration(marqueeHalfLength(loop), "agenda")}s`,
      } as CSSProperties)
    : undefined;
  const showLoading = isLoading && news.length === 0;

  return (
    <section className="pulse-bar pulse-bar--agenda" aria-label="Haber gündemi">
      <div className="container pulse-bar__inner">
        <span className="pulse-bar__label mono">
          <span className="pulse-bar__dot" aria-hidden="true" />
          <span className="pulse-bar__label-text">Gündem çizgisi</span>
        </span>

        <div className={`pulse-bar__viewport${showLoading ? " pulse-bar__viewport--loading" : ""}`}>
          <div className={`pulse-bar__track${showLoading ? " pulse-bar__track--idle" : ""}`} style={trackStyle}>
            {showLoading ? (
              <span className="pulse-bar__loading mono" aria-hidden="true">
                Haberler yükleniyor…
              </span>
            ) : (
              loop.map((item, index) => (
                <Link
                  className="pulse-bar__item"
                  key={`${item.id}-${index}`}
                  to={`/haberler/${item.slug}`}
                >
                  {item.category ? (
                    <span className="pulse-bar__cat mono">{item.category}</span>
                  ) : null}
                  {item.title}
                </Link>
              ))
            )}
          </div>
        </div>

        <Link className="btn-link pulse-bar__cta" to="/haberler">
          Tüm haberleri aç
        </Link>
      </div>
    </section>
  );
}
