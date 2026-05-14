import GeographicalIndicationsAtlas from "../components/GeographicalIndicationsAtlas";
import PageHero from "../components/PageHero";

export default function GeographicalIndicationsPage() {
  return (
    <>
      <PageHero
        breadcrumb="Coğrafi İşaretler"
        eyebrow="Bölgesel Değer · Coğrafi İşaretler"
        title={<>Erzurum'un Tescilli <em>Ürün Mirası</em></>}
        intro="Erzurum'un üretim kültürünü, gastronomisini, el sanatlarını ve bölgesel ticaret değerlerini taşıyan coğrafi işaretli ürünleri tek bir prestijli atlas içinde keşfedin."
      />
      <GeographicalIndicationsAtlas />
    </>
  );
}
