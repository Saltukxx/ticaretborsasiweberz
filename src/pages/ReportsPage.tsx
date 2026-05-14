import PageHero from "../components/PageHero";
import ReportCards from "../components/ReportCards";

export default function ReportsPage() {
  return (
    <>
      <PageHero
        breadcrumb="Raporlar"
        eyebrow="Veri · Analiz · Sektör"
        title={<>Raporlar ve <em>Piyasa Analizleri</em></>}
        intro="Günlük, haftalık ve aylık piyasa değerlendirmelerine hızlı erişim. Tüm raporlar PDF olarak indirilebilir."
      />
      <ReportCards />
    </>
  );
}
