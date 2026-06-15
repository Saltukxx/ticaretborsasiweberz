import { Link, useParams } from "react-router-dom";
import PageHero from "../components/PageHero";
import SeoHead from "../components/SeoHead";
import { usePublicGeoItem } from "../hooks/usePublicApi";
import { ApiError } from "../lib/publicApi";
import { resolveGeoFallbackImage } from "../lib/geoFallbackImages";
import { resolveMediaUrl } from "../lib/resolveMediaUrl";
import "./ContentDetailPage.css";
import "./GeoDetailPage.css";

export default function GeoDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: item, isLoading, error } = usePublicGeoItem(slug);
  const err404 = error instanceof ApiError && error.status === 404;
  const path = slug ? `/cografi-isaretler/${slug}` : "/cografi-isaretler";

  const coverSrc = item?.coverUrl
    ? resolveMediaUrl(item.coverUrl)
    : item
      ? resolveGeoFallbackImage(item.slug, item.name)
      : null;

  return (
    <>
      <SeoHead
        title={item?.name ?? (err404 ? "Ürün bulunamadı" : "Coğrafi işaret")}
        description={
          item?.story?.slice(0, 160) ??
          "Erzurum coğrafi işaretli ürün detayı."
        }
        path={path}
        image={coverSrc ?? undefined}
        noindex={err404}
      />
      <PageHero
        breadcrumb="Coğrafi İşaretler"
        eyebrow={item?.category ?? "Coğrafi işaret"}
        title={item?.name ?? (err404 ? "Kayıt bulunamadı" : "Coğrafi işaret")}
        intro={item?.district ? `${item.district} · Erzurum` : "Bölgesel tescilli ürün."}
      />
      <section className="content-detail geo-detail">
        <div className="container content-detail__inner">
          <nav className="content-detail__back mono">
            <Link to="/cografi-isaretler">← Atlas</Link>
          </nav>

          {isLoading && <p className="content-detail__state">Yükleniyor…</p>}

          {!isLoading && error && (
            <p className="content-detail__state content-detail__state--error">
              {err404 ? "Coğrafi işaret kaydı bulunamadı." : "Kayıt yüklenemedi."}
            </p>
          )}

          {!isLoading && item && (
            <article className="geo-detail__article card">
              {coverSrc && (
                <figure className="geo-detail__cover">
                  <img src={coverSrc} alt={item.name} loading="eager" />
                </figure>
              )}
              <dl className="geo-detail__meta mono">
                {item.registrationNo && (
                  <div>
                    <dt>Tescil no</dt>
                    <dd>{item.registrationNo}</dd>
                  </div>
                )}
                {item.type && (
                  <div>
                    <dt>Tür</dt>
                    <dd>{item.type}</dd>
                  </div>
                )}
                {item.registeredAt && (
                  <div>
                    <dt>Tescil tarihi</dt>
                    <dd>{item.registeredAt}</dd>
                  </div>
                )}
              </dl>
              {item.story && <p className="geo-detail__story">{item.story}</p>}
            </article>
          )}
        </div>
      </section>
    </>
  );
}
