import { useMemo, useState, type CSSProperties } from "react";
import {
  geoCategories,
  geographicalIndications,
  type GeoCategory,
  type GeographicalIndication,
} from "../data/geographical-indications";
import { useReveal } from "../hooks/useReveal";
import "./GeographicalIndicationsAtlas.css";

type FilterKey = "Tüm Ürünler" | GeoCategory;

const showcaseProducts = [
  {
    name: "Oltu Cağ Kebabı",
    category: "Gastronomi",
    origin: "Oltu",
    image:
      "https://www.kulturportali.gov.tr/repoKulturPortali/Dokumanlar/OltuCagKebabi_20180518112403950.jpg?format=jpg&quality=70",
  },
  {
    name: "İspir Fasulyesi",
    category: "Tarım",
    origin: "İspir",
    image:
      "https://www.kulturportali.gov.tr/repoKulturPortali/large/SehirRehberi//NeAlinir/20180502104432221_Ispir%20Fasulyesi.JPG?format=jpg&quality=70",
  },
  {
    name: "Civil Peynir",
    category: "Yayla",
    origin: "Erzurum",
    image:
      "https://kulturportali.gov.tr/repoKulturPortali/large/SehirRehberi//NeAlinir/20180502104025194_Civil%20peynir.jpg?format=jpg&quality=70",
  },
  {
    name: "Kadayıf Dolması",
    category: "Tatlı",
    origin: "Erzurum",
    image:
      "https://beta.kulturportali.gov.tr/repoKulturPortali/large/SehirRehberi//NeAlinir/20180502103415957_ERZURUM%20KADYIF%20DOLMASI%20Fotograf%20Murat%20OCAL%200543.JPG?format=jpg&quality=70",
  },
  {
    name: "Oltu Taşı",
    category: "Zanaat",
    origin: "Oltu",
    image:
      "https://kulturportali.gov.tr/repoKulturPortali/large/SehirRehberi//NeAlinir/20180502100932192_ERZURUM%20OLTUSTASI%20TESPIH.jpg?format=jpg&quality=70",
  },
] as const;

const productImages: Partial<Record<string, (typeof showcaseProducts)[number]>> = showcaseProducts.reduce(
  (images, product) => ({ ...images, [product.name]: product, [`Erzurum ${product.name}`]: product }),
  {
    "Erzurum Civil Peyniri": showcaseProducts[2],
  } as Partial<Record<string, (typeof showcaseProducts)[number]>>
);

const categoryIntros: Record<GeoCategory, string> = {
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

function categoryCount(category: GeoCategory) {
  return geographicalIndications.filter((item) => item.category === category).length;
}

function categoryExamples(category: GeoCategory) {
  return geographicalIndications
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
  const [activeCategory, setActiveCategory] = useState<FilterKey>("Tüm Ürünler");
  const introRef = useReveal<HTMLDivElement>();
  const featuredRef = useReveal<HTMLDivElement>();
  const categoryRef = useReveal<HTMLDivElement>();
  const indexRef = useReveal<HTMLDivElement>();

  const highlighted = geographicalIndications.filter((item) => item.highlight);
  const districtCount = new Set(geographicalIndications.map((item) => item.district).filter(Boolean)).size;
  const filteredProducts = useMemo(
    () =>
      activeCategory === "Tüm Ürünler"
        ? geographicalIndications
        : geographicalIndications.filter((item) => item.category === activeCategory),
    [activeCategory]
  );

  return (
    <section className="gi-atlas">
      <div className="container">
        <div className="gi-atlas__intro reveal" ref={introRef}>
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

            <div className="gi-atlas__metrics" aria-label="Coğrafi işaret özeti">
              <Metric value={geographicalIndications.length} label="Tescilli Ürün" />
              <Metric value={geoCategories.length} label="Kategori" />
              <Metric value={districtCount} label="Öne Çıkan İlçe" />
            </div>
          </div>

          <div className="gi-atlas__photos" aria-label="Coğrafi işaretli ürün fotoğrafları">
            <figure className="gi-atlas__photo-lead">
              <img src={showcaseProducts[0].image} alt={showcaseProducts[0].name} />
              <figcaption>
                <span className="mono">{showcaseProducts[0].category}</span>
                <strong>{showcaseProducts[0].name}</strong>
                <small>{showcaseProducts[0].origin}</small>
              </figcaption>
            </figure>

            <div className="gi-atlas__photo-grid">
              {showcaseProducts.slice(1).map((product, index) => (
                <figure
                  className="gi-atlas__photo-card"
                  key={product.name}
                  style={{ "--delay": `${index * 0.06}s` } as CSSProperties}
                >
                  <img src={product.image} alt={product.name} />
                  <figcaption>
                    <span className="mono">{product.category}</span>
                    <strong>{product.name}</strong>
                  </figcaption>
                </figure>
              ))}
            </div>

            <p className="gi-atlas__photo-source">Geçici görseller: Kültür Portalı ürün arşivi.</p>
          </div>
        </div>

        <div className="gi-featured reveal" ref={featuredRef}>
          <div className="gi-featured__head section-title">
            <div>
              <span className="eyebrow">Seçili Değerler</span>
              <h2>
                Bölgenin marka gücünü taşıyan <em>öne çıkan ürünler</em>
              </h2>
            </div>
            <p>İlk bakışta ürün kalabalığı yaratmadan, Erzurum'un en bilinen değerlerini prestijli kartlarla öne çıkarıyoruz.</p>
          </div>

          <div className="gi-featured__grid">
            {highlighted.map((item, index) => (
              <FeaturedProduct item={item} index={index} key={item.id} />
            ))}
          </div>
        </div>

        <div className="gi-categories reveal" ref={categoryRef}>
          <div className="gi-categories__head">
            <span className="eyebrow">Kategori Atlası</span>
            <h2>Ürünler üretim alanlarına göre okunur.</h2>
          </div>

          <div className="gi-categories__grid">
            {geoCategories.map((category, index) => (
              <button
                type="button"
                className={`gi-categories__card ${activeCategory === category ? "is-active" : ""}`}
                onClick={() => setActiveCategory(category)}
                key={category}
                style={{ "--delay": `${index * 0.06}s` } as CSSProperties}
              >
                <span className="gi-categories__count mono">{String(categoryCount(category)).padStart(2, "0")}</span>
                <h3>{category}</h3>
                <p>{categoryIntros[category]}</p>
                <span className="gi-categories__examples">{categoryExamples(category).join(" · ")}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="gi-index reveal" ref={indexRef}>
          <div className="gi-index__head">
            <div>
              <span className="eyebrow">Tüm Ürünler Dizini</span>
              <h2>62 ürün, sakin ve filtrelenebilir bir dizinde.</h2>
            </div>
            <span className="gi-index__active mono">{activeCategory}</span>
          </div>

          <div className="gi-index__filters" role="tablist" aria-label="Ürün kategorisi filtreleri">
            {(["Tüm Ürünler", ...geoCategories] as FilterKey[]).map((category) => (
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

          <div className="gi-index__grid">
            {filteredProducts.map((item) => (
              <ProductIndexCard item={item} key={item.id} />
            ))}
          </div>
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

function FeaturedProduct({ item, index }: { item: GeographicalIndication; index: number }) {
  const image = productImages[item.name];

  return (
    <article className={`gi-featured__card gi-featured__card--${index % 4} ${image ? "gi-featured__card--photo" : ""}`}>
      {image ? (
        <img className="gi-featured__image" src={image.image} alt={item.name} />
      ) : (
        <div className="gi-featured__mark" aria-hidden>
          {productInitials(item.name)}
        </div>
      )}
      <div className="gi-featured__meta mono">
        <span>{item.category}</span>
        <span>{item.registration}</span>
      </div>
      <h3>{item.name}</h3>
      <p>{item.story}</p>
      <div className="gi-featured__foot">
        <span>{item.district ?? "Erzurum"}</span>
        <strong>{item.type}</strong>
      </div>
    </article>
  );
}

function ProductIndexCard({ item }: { item: GeographicalIndication }) {
  return (
    <article className="gi-index__item">
      <span className="gi-index__abbr mono">{productInitials(item.name)}</span>
      <div>
        <h3>{item.name}</h3>
        <p>
          {item.category} · {item.registration}
          {item.district ? ` · ${item.district}` : ""}
        </p>
      </div>
    </article>
  );
}
