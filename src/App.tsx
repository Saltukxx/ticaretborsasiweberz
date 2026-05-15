import { useEffect, useState } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import LogoIntro from "./components/LogoIntro";
import Header from "./components/Header";
import Footer from "./components/Footer";
import HomePage from "./pages/HomePage";
import PriceBulletinPage from "./pages/PriceBulletinPage";
import NewsPage from "./pages/NewsPage";
import AnnouncementsPage from "./pages/AnnouncementsPage";
import CorporatePage from "./pages/CorporatePage";
import GeographicalIndicationsPage from "./pages/GeographicalIndicationsPage";
import ReportsPage from "./pages/ReportsPage";
import ProjectsPage from "./pages/ProjectsPage";
import EventsPage from "./pages/EventsPage";
import ServicesPage from "./pages/ServicesPage";
import ContactPage from "./pages/ContactPage";
import MarketDataPage from "./pages/MarketDataPage";

export default function App() {
  const [introDone, setIntroDone] = useState(() => {
    if (typeof window === "undefined") return false;

    const forceIntro = new URLSearchParams(window.location.search).get("intro") === "1";
    if (forceIntro) return false;

    return localStorage.getItem("etb_intro_seen") === "1";
  });
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [location.pathname]);

  useEffect(() => {
    if (introDone) localStorage.setItem("etb_intro_seen", "1");
  }, [introDone]);

  return (
    <>
      {!introDone && <LogoIntro onDone={() => setIntroDone(true)} />}
      <div className="grain" aria-hidden />
      <Header />
      <main className={introDone ? "site-enter" : "site-hidden"}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/kurumsal" element={<CorporatePage />} />
          <Route path="/cografi-isaretler" element={<GeographicalIndicationsPage />} />
          <Route path="/piyasa-verileri" element={<MarketDataPage />} />
          <Route path="/fiyat-bulteni" element={<PriceBulletinPage />} />
          <Route path="/haberler" element={<NewsPage />} />
          <Route path="/duyurular" element={<AnnouncementsPage />} />
          <Route path="/raporlar" element={<ReportsPage />} />
          <Route path="/projeler" element={<ProjectsPage />} />
          <Route path="/etkinlikler" element={<EventsPage />} />
          <Route path="/hizmetler" element={<ServicesPage />} />
          <Route path="/iletisim" element={<ContactPage />} />
          <Route path="*" element={<HomePage />} />
        </Routes>
      </main>
      <Footer />
    </>
  );
}
