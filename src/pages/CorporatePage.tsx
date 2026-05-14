import PageHero from "../components/PageHero";
import CorporateSection from "../components/CorporateSection";
import RegionalMap from "../components/RegionalMap";

export default function CorporatePage() {
  return (
    <>
      <PageHero
        breadcrumb="Kurumsal"
        eyebrow="Kurumsal · 1946'dan Beri"
        title={<>Erzurum <em>Ticaret Borsası</em></>}
        intro="80 yılı aşkın kurumsal birikimle bölgemizin üretim, ticaret ve piyasa yapısına güvenilir kurumsal altyapı sunuyoruz."
      />
      <CorporateSection />
      <RegionalMap />
    </>
  );
}
