import PageHero from "../components/PageHero";
import PriceBulletinPanel from "../components/PriceBulletinPanel";
import LiveMarketStrip from "../components/LiveMarketStrip";

export default function PriceBulletinPage() {
  return (
    <>
      <PageHero
        breadcrumb="Fiyat Bülteni"
        eyebrow="Fiyat Bülteni · Tescilli Veri"
        title={<>Güncel <em>Fiyat Bülteni</em></>}
        intro="Ürün bazlı fiyat hareketlerini, günlük ortalamaları ve piyasa eğilimlerini tek ekranda takip edin. Tüm değerler tescilli işlemlere dayanır ve günlük olarak güncellenir."
      />
      <LiveMarketStrip />
      <PriceBulletinPanel />
    </>
  );
}
