import { useMemo, useState, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import { usePublicGeo } from "../hooks/usePublicApi";
import { useReveal } from "../hooks/useReveal";
import { parseLocalDate } from "../lib/formatLocalDate";
import type { PublicGeoIndication } from "../lib/publicApi";
import { resolveGeoFallbackImage } from "../lib/geoFallbackImages";
import { resolveMediaUrl } from "../lib/resolveMediaUrl";
import { revealClass } from "../lib/revealClass";
import "./GeographicalIndicationsAtlas.css";

type FilterKey = "Tüm Ürünler" | string;

type GeoDisplayItem = {
  id: string;
  slug: string;
  name: string;
  category: string;
  type: string;
  registration: string;
  district?: string;
  highlight: boolean;
  story?: string;
  coverUrl?: string | null;
  sortOrder: number;
};

const categoryIntros: Record<string, string> = {
  "Süt Ürünleri": "Yayla kültürü, süt işleme bilgisi ve yüksek rakımın lezzete dönüştüğü ürünler.",
  Yemekler: "Erzurum sofrasının gündelik hafızasını ve misafir geleneğini taşıyan tarifler.",
  Çorbalar: "Kış iklimi, dayanıklılık ve yerel mutfak bilgisini bir araya getiren çorba mirası.",
  Tatlılar: "Usta eli, şerbet, pekmez ve geleneksel tat dokusuyla öne çıkan ürünler.",
  "Tarım Ürünleri": "İlçelerin üretim karakterini, toprak ve iklim bilgisini taşıyan tarımsal değerler.",
  "Ekmek ve Hamur İşleri": "Hamur, tandır, yufka ve börek geleneğini temsil eden güçlü yerel üretimler.",
  "Et Ürünleri": "Hayvancılık kültürü, usta pişirme teknikleri ve bölgesel lezzet kimliği.",
  "Dokuma ve El Sanatları": "El emeği, dokuma kültürü ve yerel zanaat hafızasını yaşatan ürünler.",
  "Taş ve Maden": "Oltu taşı gibi yer altı değerlerini ustalıkla ticari kimliğe dönüştüren alan.",
};

function formatRegistration(registeredAt: string | null, registrationNo: string | null): string {
  const parts: string[] = [];

  if (registeredAt) {
    parts.push(
      parseLocalDate(registeredAt).toLocaleDateString("tr-TR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }),
    );
  }

  if (registrationNo) {
    parts.push(registrationNo);
  }

  return parts.join(" · ");
}

function mapGeoItem(item: PublicGeoIndication): GeoDisplayItem {
  const apiCover = item.coverUrl ? resolveMediaUrl(item.coverUrl) : null;
  const coverUrl = apiCover ?? resolveGeoFallbackImage(item.slug, item.name);

  return {
    id: item.id,
    slug: item.slug,
    name: item.name,
    category: item.category,
    type: item.type,
    registration: formatRegistration(item.registeredAt, item.registrationNo),
    district: item.district ?? undefined,
    highlight: item.isHighlight,
    story: item.story ?? undefined,
    coverUrl,
    sortOrder: item.sortOrder,
  };
}

function uniqueCategories(products: GeoDisplayItem[]): string[] {
  return [...new Set(products.map((item) => item.category))].sort((a, b) =>
    a.localeCompare(b, "tr-TR"),
  );
}

function categoryCount(products: GeoDisplayItem[], category: string) {
  return products.filter((item) => item.category === category).length;
}

function categoryExamples(products: GeoDisplayItem[], category: string) {
  return products
    .filter((item) => item.category === category)
    .slice(0, 3)
    .map((item) => item.name.replace("Erzurum ", ""));
}

function productInitials(name: string) {
  return name
    .replace("Erzurum ", "")
    .split(/\s|\/|-/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toLocaleUpperCase("tr-TR");
}

export default function GeographicalIndicationsAtlas() {
  const { data: apiGeo, isLoading, isError } = usePublicGeo();
  const [activeCategory, setActiveCategory] = useState<FilterKey>("Tüm Ürünler");
  const introRef = useReveal<HTMLDivElement>();
  const featuredRef = useReveal<HTMLDivElement>();
  const categoryRef = useReveal<HTMLDivElement>();
  const indexRef = useReveal<HTMLDivElement>();

  const contentReady = !isLoading && !isError;

  const products = useMemo(() => (apiGeo ?? []).map(mapGeoItem), [apiGeo]);
  const categories = useMemo(() => uniqueCategories(products), [products]);
  const districtCount = useMemo(
    () => new Set(products.map((item) => item.district).filter(Boolean)).size,
    [products],
  );
  const highlighted = useMemo(
    () =>
      products
        .filter((item) => item.highlight)
        .sort((a, b) => a.sortOrder - b.sortOrder),
    [products],
  );
  const showcasePhotos = useMemo(
    () =>
      [...highlighted]
        .sort(
          (a, b) =>
            Number(Boolean(b.coverUrl)) - Number(Boolean(a.coverUrl)) ||
            a.sortOrder - b.sortOrder,
        )
        .filter((item) => item.coverUrl)
        .slice(0, 5),
    [highlighted],
  );
  const showcaseFallback = useMemo(() => highlighted.slice(0, 5), [highlighted]);
  const filteredProducts = useMemo(
    () =>
      activeCategory === "Tüm Ürünler"
        ? products
        : products.filter((item) => item.category === activeCategory),
    [activeCategory, products],
  );

  return (
    <section className="gi-atlas">
      <div className="container">
        <div
          className={`gi-atlas__intro reveal ${revealClass(contentReady)}`}
          ref={introRef}
        >
          <div className="gi-atlas__intro-copy">
            <span className="eyebrow">Ürün Mirası Atlası</span>
            <h2>
              Erzurum'un üretim hafızası <em>tescilli değerlerle</em> korunuyor.
            </h2>
            <p>
              Coğrafi işaretler; ürünün yalnızca adını değil, yöresini, üretim
              bilgisini, emeğini ve ticari itibarını da korur. Erzurum'un bu
              zenginliği tarımdan gastronomiye, dokumadan Oltu taşına uzanan
              geniş bir bölgesel değer haritası oluşturur.
            </p>

            {isLoading ? (
              <p className="gi-atlas__status">Coğrafi işaretler yükleniyor…</p>
            ) : isError ? (
              <p className="gi-atlas__status">Coğrafi işaret listesi şu an yüklenemedi.</p>
            ) : products.length === 0 ? (
              <p className="gi-atlas__status">Henüz listelenecek coğrafi işaret bulunmuyor.</p>
            ) : null}

            <div className="gi-atlas__metrics" aria-label="Coğrafi işaret özeti">
              <Metric value={products.length} label="Tescilli Ürün" />
              <Metric value={categories.length} label="Kategori" />
              <Metric value={districtCount} label="Öne Çıkan İlçe" />
            </div>
          </div>

          {contentReady && products.length > 0 ? (
            showcasePhotos.length > 0 ? (
              <div className="gi-atlas__photos" aria-label="Coğrafi işaretli ürün fotoğrafları">
                <figure className="gi-atlas__photo-lead">
                  <img src={showcasePhotos[0].coverUrl!} alt={showcasePhotos[0].name} />
                  <figcaption>
                    <span className="mono">{showcasePhotos[0].category}</span>
                    <strong>{showcasePhotos[0].name}</strong>
                    <small>{showcasePhotos[0].district ?? "Erzurum"}</small>
                  </figcaption>
                </figure>

                {showcasePhotos.length > 1 ? (
                  <div className="gi-atlas__photo-grid">
                    {showcasePhotos.slice(1).map((product, index) => (
                      <figure
                        className="gi-atlas__photo-card"
                        key={product.id}
                        style={{ "--delay": `${index * 0.06}s` } as CSSProperties}
                      >
                        <img src={product.coverUrl!} alt={product.name} />
                        <figcaption>
                          <span className="mono">{product.category}</span>
                          <strong>{product.name}</strong>
                        </figcaption>
                      </figure>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : showcaseFallback.length > 0 ? (
              <div className="gi-atlas__photos" aria-label="Coğrafi işaretli ürün kartları">
                <figure className="gi-atlas__photo-lead gi-atlas__photo-lead--initials">
                  <div className="gi-atlas__photo-initials" aria-hidden>
                    {productInitials(showcaseFallback[0].name)}
                  </div>
                  <figcaption>
                    <span className="mono">{showcaseFallback[0].category}</span>
                    <strong>{showcaseFallback[0].name}</strong>
                    <small>{showcaseFallback[0].district ?? "Erzurum"}</small>
                  </figcaption>
                </figure>

                {showcaseFallback.length > 1 ? (
                  <div className="gi-atlas__photo-grid">
                    {showcaseFallback.slice(1).map((product, index) => (
                      <figure
                        className="gi-atlas__photo-card gi-atlas__photo-card--initials"
                        key={product.id}
                        style={{ "--delay": `${index * 0.06}s` } as CSSProperties}
                      >
                        <div className="gi-atlas__photo-initials" aria-hidden>
                          {productInitials(product.name)}
                        </div>
                        <figcaption>
                          <span className="mono">{product.category}</span>
                          <strong>{product.name}</strong>
                        </figcaption>
                      </figure>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null
          ) : null}
        </div>

        <div
          className={`gi-featured reveal ${revealClass(contentReady)}`}
          ref={featuredRef}
        >
          <div className="gi-featured__head section-title">
            <div>
              <span className="eyebrow">Seçili Değerler</span>
              <h2>
                Bölgenin marka gücünü taşıyan <em>öne çıkan ürünler</em>
              </h2>
            </div>
            <p>İlk bakışta ürün kalabalığı yaratmadan, Erzurum'un en bilinen değerlerini prestijli kartlarla öne çıkarıyoruz.</p>
          </div>

          {contentReady && highlighted.length > 0 ? (
            <div className="gi-featured__grid">
              {highlighted.map((item, index) => (
                <FeaturedProduct item={item} index={index} key={item.id} />
              ))}
            </div>
          ) : contentReady && products.length > 0 ? (
            <p className="gi-atlas__status">Öne çıkarılmış ürün bulunmuyor.</p>
          ) : null}
        </div>

        <div
          className={`gi-categories reveal ${revealClass(contentReady)}`}
          ref={categoryRef}
        >
          <div className="gi-categories__head">
            <span className="eyebrow">Kategori Atlası</span>
            <h2>Ürünler üretim alanlarına göre okunur.</h2>
          </div>

          {contentReady && categories.length > 0 ? (
            <div className="gi-categories__grid">
              {categories.map((category, index) => (
                <button
                  type="button"
                  className={`gi-categories__card ${activeCategory === category ? "is-active" : ""}`}
                  onClick={() => setActiveCategory(category)}
                  key={category}
                  style={{ "--delay": `${index * 0.06}s` } as CSSProperties}
                >
                  <span className="gi-categories__count mono">
                    {String(categoryCount(products, category)).padStart(2, "0")}
                  </span>
                  <h3>{category}</h3>
                  <p>{categoryIntros[category] ?? "Erzurum'un tescilli ürün mirasından seçilmiş bir kategori."}</p>
                  <span className="gi-categories__examples">
                    {categoryExamples(products, category).join(" · ")}
                  </span>
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div
          className={`gi-index reveal ${revealClass(contentReady)}`}
          ref={indexRef}
        >
          <div className="gi-index__head">
            <div>
              <span className="eyebrow">Tüm Ürünler Dizini</span>
              <h2>
                {products.length} ürün, sakin ve filtrelenebilir bir dizinde.
              </h2>
            </div>
            <span className="gi-index__active mono">{activeCategory}</span>
          </div>

          {contentReady && categories.length > 0 ? (
            <div className="gi-index__filters" role="tablist" aria-label="Ürün kategorisi filtreleri">
              {(["Tüm Ürünler", ...categories] as FilterKey[]).map((category) => (
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeCategory === category}
                  className={`gi-index__filter ${activeCategory === category ? "is-active" : ""}`}
                  onClick={() => setActiveCategory(category)}
                  key={category}
                >
                  {category}
                </button>
              ))}
            </div>
          ) : null}

          {isLoading ? (
            <p className="gi-atlas__status">Ürün dizini yükleniyor…</p>
          ) : isError ? (
            <p className="gi-atlas__status">Ürün dizini şu an yüklenemedi.</p>
          ) : filteredProducts.length > 0 ? (
            <div className="gi-index__grid">
              {filteredProducts.map((item) => (
                <ProductIndexCard item={item} key={item.id} />
              ))}
            </div>
          ) : contentReady ? (
            <p className="gi-atlas__status">
              {activeCategory === "Tüm Ürünler"
                ? "Henüz listelenecek ürün bulunmuyor."
                : "Bu kategoride ürün bulunmuyor."}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function Metric({ value, label }: { value: number; label: string }) {
  return (
    <div className="gi-atlas__metric">
      <strong className="mono">{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function FeaturedProduct({ item, index }: { item: GeoDisplayItem; index: number }) {
  const detailPath =
    item.slug === "kadayif-dolmasi"
      ? "/cografi-isaretler/kadayif-dolmasi"
      : `/cografi-isaretler/${item.slug}`;

  return (
    <article
      className={`gi-featured__card gi-featured__card--${index % 4} ${item.coverUrl ? "gi-featured__card--photo" : ""}`}
    >
      {item.coverUrl ? (
        <img className="gi-featured__image" src={item.coverUrl} alt={item.name} />
      ) : null}
      <Link to={detailPath} className="gi-featured__link">
      {!item.coverUrl ? (
        <div className="gi-featured__mark" aria-hidden>
          {productInitials(item.name)}
        </div>
      ) : null}
      <div className="gi-featured__meta mono">
        <span>{item.category}</span>
        {item.registration ? <span>{item.registration}</span> : null}
      </div>
      <h3>{item.name}</h3>
      {item.story ? <p>{item.story}</p> : null}
      <div className="gi-featured__foot">
        <span>{item.district ?? "Erzurum"}</span>
        <strong>{item.type}</strong>
      </div>
      </Link>
      {item.slug === "kadayif-dolmasi" && (
        <Link to="/cografi-isaretler/kadayif-dolmasi" className="gi-featured__cta">
          <span className="gi-featured__cta-icon">▶</span>
          Yapılışını İzle & Chatbot ile Keşfet
        </Link>
      )}
    </article>
  );
}

function ProductIndexCard({ item }: { item: GeoDisplayItem }) {
  const detailPath =
    item.slug === "kadayif-dolmasi"
      ? "/cografi-isaretler/kadayif-dolmasi"
      : `/cografi-isaretler/${item.slug}`;

  return (
    <Link to={detailPath} className="gi-index__item gi-index__link">
      <span className="gi-index__abbr mono">{productInitials(item.name)}</span>
      <div>
        <h3>{item.name}</h3>
        <p>
          {item.category}
          {item.registration ? ` · ${item.registration}` : ""}
          {item.district ? ` · ${item.district}` : ""}
        </p>
      </div>
    </Link>
  );
}
