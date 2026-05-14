import PageHero from "../components/PageHero";
import ServicesGrid from "../components/ServicesGrid";

export default function ServicesPage() {
  return (
    <>
      <PageHero
        breadcrumb="Hizmetler"
        eyebrow="Kurumsal Portal · Üye Hizmetleri"
        title={<>Kurumsal <em>Hizmetler</em></>}
        intro="Üyelerimize ve bölge ticaretine yönelik hizmetlere hızlı erişim. Dijital ve fiziksel kanallar tek panelde."
      />
      <ServicesGrid />
    </>
  );
}
