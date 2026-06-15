import { useEffect } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import Header from "./components/Header";
import Footer from "./components/Footer";
import FloatingActions from "./components/FloatingActions";
import RouteSeo from "./components/RouteSeo";
import HomePage from "./pages/HomePage";
import PriceBulletinPage from "./pages/PriceBulletinPage";
import NewsPage from "./pages/NewsPage";
import NewsDetailPage from "./pages/NewsDetailPage";
import AnnouncementsPage from "./pages/AnnouncementsPage";
import AnnouncementDetailPage from "./pages/AnnouncementDetailPage";
import CorporatePage from "./pages/CorporatePage";
import GeographicalIndicationsPage from "./pages/GeographicalIndicationsPage";
import KadayifDolmasiPage from "./pages/KadayifDolmasiPage";
import ReportsPage from "./pages/ReportsPage";
import ReportDetailPage from "./pages/ReportDetailPage";
import ProjectsPage from "./pages/ProjectsPage";
import ProjectDetailPage from "./pages/ProjectDetailPage";
import EventsPage from "./pages/EventsPage";
import ServicesPage from "./pages/ServicesPage";
import ContactPage from "./pages/ContactPage";
import LegalPage from "./pages/LegalPage";
import KvkkHubPage from "./pages/KvkkHubPage";
import KvkkDocumentPage from "./pages/KvkkDocumentPage";
import CookieConsentBanner from "./components/CookieConsentBanner";
import EventDetailPage from "./pages/EventDetailPage";
import GeoDetailPage from "./pages/GeoDetailPage";
import LeadershipPage from "./pages/LeadershipPage";
import CorporateDocumentDetailPage from "./pages/CorporateDocumentDetailPage";
import ServiceAgreementDetailPage from "./pages/ServiceAgreementDetailPage";
import NotFoundPage from "./pages/NotFoundPage";
import MarketDataPage from "./pages/MarketDataPage";
import NewsletterUnsubscribePage from "./pages/NewsletterUnsubscribePage";

export default function App() {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [location.pathname]);

  return (
    <>
      <RouteSeo />
      <div className="grain" aria-hidden />
      <Header />
      <main className="site-enter">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/kurumsal" element={<CorporatePage />} />
          <Route path="/kurumsal/yonetim" element={<LeadershipPage />} />
          <Route path="/kurumsal/belgeler/:slug" element={<CorporateDocumentDetailPage />} />
          <Route path="/cografi-isaretler" element={<GeographicalIndicationsPage />} />
          <Route path="/cografi-isaretler/kadayif-dolmasi" element={<KadayifDolmasiPage />} />
          <Route path="/cografi-isaretler/:slug" element={<GeoDetailPage />} />
          <Route path="/piyasa-verileri" element={<MarketDataPage />} />
          <Route path="/fiyat-bulteni" element={<PriceBulletinPage />} />
          <Route path="/haberler/:slug" element={<NewsDetailPage />} />
          <Route path="/haberler" element={<NewsPage />} />
          <Route path="/duyurular/:slug" element={<AnnouncementDetailPage />} />
          <Route path="/duyurular" element={<AnnouncementsPage />} />
          <Route path="/raporlar/:slug" element={<ReportDetailPage />} />
          <Route path="/raporlar" element={<ReportsPage />} />
          <Route path="/projeler/:slug" element={<ProjectDetailPage />} />
          <Route path="/projeler" element={<ProjectsPage />} />
          <Route path="/etkinlikler/:slug" element={<EventDetailPage />} />
          <Route path="/etkinlikler" element={<EventsPage />} />
          <Route path="/hizmetler/anlasmalar/:slug" element={<ServiceAgreementDetailPage />} />
          <Route path="/hizmetler" element={<ServicesPage />} />
          <Route path="/iletisim" element={<ContactPage />} />
          <Route path="/kvkk" element={<KvkkHubPage />} />
          <Route path="/kvkk/:slug" element={<KvkkDocumentPage />} />
          <Route path="/yasal/:slug" element={<LegalPage />} />
          <Route path="/e-bulten/ayril" element={<NewsletterUnsubscribePage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      <Footer />
      <CookieConsentBanner />
      <FloatingActions />
    </>
  );
}
