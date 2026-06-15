import { Navigate, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { SuperAdminRoute } from "@/components/SuperAdminRoute";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { AccountSettingsPage } from "@/pages/AccountSettingsPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { LoginPage } from "@/pages/LoginPage";
import { NewsEditPage } from "@/pages/news/NewsEditPage";
import { NewsListPage } from "@/pages/news/NewsListPage";
import { AnnouncementEditPage } from "@/pages/announcements/AnnouncementEditPage";
import { AnnouncementsListPage } from "@/pages/announcements/AnnouncementsListPage";
import { EventEditPage } from "@/pages/events/EventEditPage";
import { EventsListPage } from "@/pages/events/EventsListPage";
import { ReportEditPage } from "@/pages/reports/ReportEditPage";
import { ReportsListPage } from "@/pages/reports/ReportsListPage";
import { ProjectEditPage } from "@/pages/projects/ProjectEditPage";
import { ProjectsListPage } from "@/pages/projects/ProjectsListPage";
import { CurrencyRatesPage } from "@/pages/currency/CurrencyRatesPage";
import { ServiceEditPage } from "@/pages/services/ServiceEditPage";
import { ServicesListPage } from "@/pages/services/ServicesListPage";
import { GeoEditPage } from "@/pages/geo/GeoEditPage";
import { GeoListPage } from "@/pages/geo/GeoListPage";
import { LeadershipEditPage } from "@/pages/leadership/LeadershipEditPage";
import { LeadershipSectionsPage } from "@/pages/leadership/LeadershipSectionsPage";
import { StatEditPage } from "@/pages/stats/StatEditPage";
import { StatsListPage } from "@/pages/stats/StatsListPage";
import { MediaLibraryPage } from "@/pages/media/MediaLibraryPage";
import { UsersAdminPage } from "@/pages/settings/UsersAdminPage";
import { AuditLogPage } from "@/pages/settings/AuditLogPage";
import { PricesPage } from "@/pages/prices/PricesPage";
import { MapDistrictsListPage } from "@/pages/map/MapDistrictsListPage";
import { MapDistrictEditPage } from "@/pages/map/MapDistrictEditPage";
import { CorporateContentPage } from "@/pages/corporate/CorporateContentPage";
import { CorporateDocumentsPage } from "@/pages/corporate/CorporateDocumentsPage";
import { CorporateDocumentEditPage } from "@/pages/corporate/CorporateDocumentEditPage";
import { HeroContentPage } from "@/pages/hero/HeroContentPage";
import { PresidentMessagePage } from "@/pages/president/PresidentMessagePage";
import { DatabankSyncPage } from "@/pages/sync/DatabankSyncPage";
import { ContactSubmissionsPage } from "@/pages/site/ContactSubmissionsPage";
import { NewsletterSubscribersPage } from "@/pages/site/NewsletterSubscribersPage";
import { LegalPagesPage } from "@/pages/site/LegalPagesPage";
import { ChatLogsPage } from "@/pages/site/ChatLogsPage";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<ProtectedRoute />}>
        <Route path="/" element={<DashboardLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="news" element={<NewsListPage />} />
          <Route path="news/new" element={<NewsEditPage />} />
          <Route path="news/:id/edit" element={<NewsEditPage />} />
          <Route path="announcements" element={<AnnouncementsListPage />} />
          <Route path="announcements/new" element={<AnnouncementEditPage />} />
          <Route path="announcements/:id/edit" element={<AnnouncementEditPage />} />
          <Route path="events" element={<EventsListPage />} />
          <Route path="events/new" element={<EventEditPage />} />
          <Route path="events/:id/edit" element={<EventEditPage />} />
          <Route path="reports" element={<ReportsListPage />} />
          <Route path="reports/new" element={<ReportEditPage />} />
          <Route path="reports/:id/edit" element={<ReportEditPage />} />
          <Route path="projects" element={<ProjectsListPage />} />
          <Route path="projects/new" element={<ProjectEditPage />} />
          <Route path="projects/:id/edit" element={<ProjectEditPage />} />
          <Route path="currency-rates" element={<CurrencyRatesPage />} />
          <Route path="services" element={<ServicesListPage />} />
          <Route path="services/new" element={<ServiceEditPage />} />
          <Route path="services/:id/edit" element={<ServiceEditPage />} />
          <Route path="geo-indications" element={<GeoListPage />} />
          <Route path="geo-indications/new" element={<GeoEditPage />} />
          <Route path="geo-indications/:id/edit" element={<GeoEditPage />} />
          <Route path="leadership" element={<LeadershipSectionsPage />} />
          <Route path="leadership/new" element={<LeadershipEditPage />} />
          <Route path="leadership/:id/edit" element={<LeadershipEditPage />} />
          <Route path="stats" element={<StatsListPage />} />
          <Route path="stats/new" element={<StatEditPage />} />
          <Route path="stats/:id/edit" element={<StatEditPage />} />
          <Route path="media" element={<MediaLibraryPage />} />
          <Route path="map-districts" element={<MapDistrictsListPage />} />
          <Route path="map-districts/:slug/edit" element={<MapDistrictEditPage />} />
          <Route path="corporate-content" element={<CorporateContentPage />} />
          <Route path="corporate-documents" element={<CorporateDocumentsPage />} />
          <Route
            path="corporate-documents/:id/edit"
            element={<CorporateDocumentEditPage />}
          />
          <Route path="contact-submissions" element={<ContactSubmissionsPage />} />
          <Route path="chat-logs" element={<ChatLogsPage />} />
          <Route path="newsletter-subscribers" element={<NewsletterSubscribersPage />} />
          <Route path="legal-pages" element={<LegalPagesPage />} />
          <Route path="hero-content" element={<HeroContentPage />} />
          <Route path="president-message" element={<PresidentMessagePage />} />
          <Route path="prices" element={<PricesPage />} />
          <Route
            path="databank-sync"
            element={
              <SuperAdminRoute>
                <DatabankSyncPage />
              </SuperAdminRoute>
            }
          />
          <Route path="settings" element={<AccountSettingsPage />} />
          <Route
            path="settings/admins"
            element={
              <SuperAdminRoute>
                <UsersAdminPage />
              </SuperAdminRoute>
            }
          />
          <Route
            path="settings/audit-log"
            element={
              <SuperAdminRoute>
                <AuditLogPage />
              </SuperAdminRoute>
            }
          />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
