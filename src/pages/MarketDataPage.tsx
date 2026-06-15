import PageHero from "../components/PageHero";
import MarketPriceOverview from "../components/MarketPriceOverview";

export default function MarketDataPage() {
  return (
    <>
      <PageHero
        breadcrumb="Piyasa Verileri"
        eyebrow="Canlı Veri · Tescilli Akış"
        title={<>Piyasa <em>Verileri</em></>}
        intro="Ürün bazlı fiyat hareketleri, güncel kurlar ve tescilli piyasa özetleri tek panelde. Veriler tescilli işlemlerden derlenir."
      />
      <MarketPriceOverview />
    </>
  );
}
