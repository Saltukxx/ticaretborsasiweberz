import PageHero from "../components/PageHero";
import NewsEditorial from "../components/NewsEditorial";
import SeoHead from "../components/SeoHead";

export default function NewsPage() {
  return (
    <>
      <SeoHead
        title="Haberler"
        description="Erzurum Ticaret Borsası kurumsal haber arşivi: toplantılar, ziyaretler, üye temasları ve sektörel gelişmeler."
        path="/haberler"
      />
      <PageHero
        breadcrumb="Haberler"
        eyebrow="İnsan · Bölge · Kurumsal Gündem"
        title={<>Borsadan <em>Haberler</em></>}
        intro="Erzurum Ticaret Borsası'ndan güncel gelişmeler, toplantılar, üye temasları ve sektörel haberler; arşivdeki tüm içeriklere sayfa sayfa erişebilirsiniz."
      />
      <NewsEditorial paginated pageSize={12} />
    </>
  );
}
