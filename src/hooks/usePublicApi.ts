import { useQuery } from "@tanstack/react-query";
import {
  ApiError,
  fetchAnnouncementsTicker,
  fetchAnnouncementsList,
  fetchAnnouncementsListPage,
  fetchNewsList,
  fetchNewsListPage,
  fetchNewsBySlug,
  fetchAnnouncementBySlug,
  fetchCurrencyRates,
  fetchMarketTicker,
  fetchCurrentPrices,
  fetchPriceBulletin,
  fetchExternalBulletins,
  fetchPriceHistory,
  fetchPriceHistoryWithFallback,
  fetchStats,
  type PriceHistoryPeriod,
  fetchServices,
  fetchReports,
  fetchReportBySlug,
  fetchEvents,
  type PublicEventsWhen,
  fetchLeadership,
  fetchPresident,
  fetchProjects,
  fetchProjectBySlug,
  fetchMapDistricts,
  fetchAllGeoIndications,
  fetchCorporate,
  fetchCorporateDocuments,
  fetchCorporateDocumentBySlug,
  fetchServiceAgreements,
  fetchServiceAgreementBySlug,
  fetchHero,
  fetchEventBySlug,
  fetchGeoBySlug,
  fetchSiteContact,
  fetchLegalPage,
} from "../lib/publicApi";

export const PUBLIC_NEWS_LIST_KEY = (limit: number) =>
  ["public", "news", "list", limit] as const;
export const PUBLIC_CURRENCY_RATES_KEY = ["public", "currency-rates"] as const;
export const PUBLIC_MARKET_TICKER_KEY = ["public", "market-ticker"] as const;
export const PUBLIC_CURRENT_PRICES_KEY = ["public", "prices", "current"] as const;

export function useAnnouncementsTicker() {
  return useQuery({
    queryKey: ["public", "announcements", "ticker"],
    queryFn: fetchAnnouncementsTicker,
    staleTime: 60_000,
  });
}

export function useAnnouncements(limit = 20) {
  return useQuery({
    queryKey: ["public", "announcements", "list", limit],
    queryFn: () => fetchAnnouncementsList(limit, 0),
    staleTime: 60_000,
  });
}

export function useAnnouncementsPage(limit: number, offset: number) {
  return useQuery({
    queryKey: ["public", "announcements", "list", limit, offset] as const,
    queryFn: () => fetchAnnouncementsListPage(limit, offset),
    staleTime: 60_000,
  });
}

export function useNewsList(limit = 20) {
  return useQuery({
    queryKey: PUBLIC_NEWS_LIST_KEY(limit),
    queryFn: () => fetchNewsList(limit, 0),
    staleTime: 120_000,
  });
}

export function useNewsListPage(limit: number, offset: number) {
  return useQuery({
    queryKey: ["public", "news", "list", limit, offset] as const,
    queryFn: () => fetchNewsListPage(limit, offset),
    staleTime: 120_000,
  });
}

export function useNewsArticle(slug: string | undefined) {
  return useQuery({
    queryKey: ["public", "news", "slug", slug],
    queryFn: () => fetchNewsBySlug(slug!),
    enabled: Boolean(slug),
    staleTime: 120_000,
  });
}

export function useAnnouncement(slug: string | undefined) {
  return useQuery({
    queryKey: ["public", "announcements", "slug", slug],
    queryFn: () => fetchAnnouncementBySlug(slug!),
    enabled: Boolean(slug),
    staleTime: 60_000,
  });
}

export function useCurrencyRates() {
  return useQuery({
    queryKey: PUBLIC_CURRENCY_RATES_KEY,
    queryFn: fetchCurrencyRates,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}

export function useMarketTicker() {
  return useQuery({
    queryKey: PUBLIC_MARKET_TICKER_KEY,
    queryFn: fetchMarketTicker,
    staleTime: 60_000,
    refetchInterval: 120_000,
  });
}

export function useCurrentPrices(options?: { enabled?: boolean }) {
  const enabled = options?.enabled ?? true;
  return useQuery({
    queryKey: PUBLIC_CURRENT_PRICES_KEY,
    queryFn: fetchCurrentPrices,
    enabled,
    staleTime: 60_000,
    refetchInterval: enabled ? 120_000 : false,
  });
}

export const PRICE_BULLETIN_QUERY_KEY = ["public", "prices", "bulletin"] as const;

export function usePriceBulletin(enabled = true) {
  return useQuery({
    queryKey: PRICE_BULLETIN_QUERY_KEY,
    queryFn: fetchPriceBulletin,
    enabled,
    staleTime: 300_000,
    refetchInterval: enabled ? 120_000 : false,
  });
}

export const EXTERNAL_BULLETINS_QUERY_KEY = ["public", "prices", "external-bulletins"] as const;

export function useExternalBulletins(enabled = true) {
  return useQuery({
    queryKey: EXTERNAL_BULLETINS_QUERY_KEY,
    queryFn: fetchExternalBulletins,
    enabled,
    staleTime: 300_000,
    refetchInterval: enabled ? 300_000 : false,
  });
}

export function usePriceHistory(
  productSlug: string | null | undefined,
  period: PriceHistoryPeriod,
) {
  return useQuery({
    queryKey: ["public", "prices", "history", productSlug, period],
    queryFn: () => fetchPriceHistory(productSlug!, period),
    enabled: Boolean(productSlug),
    staleTime: 60_000,
    placeholderData: (prev) => prev,
  });
}

export function usePriceHistoryWithFallback(
  productSlug: string | null | undefined,
  period: PriceHistoryPeriod,
) {
  return useQuery({
    queryKey: ["public", "prices", "history-fb", productSlug, period],
    queryFn: () => fetchPriceHistoryWithFallback(productSlug!, period),
    enabled: Boolean(productSlug),
    staleTime: 60_000,
    placeholderData: (prev) => prev,
  });
}

export function usePublicStats() {
  return useQuery({
    queryKey: ["public", "stats"],
    queryFn: () => fetchStats(),
    staleTime: 300_000,
  });
}

export function usePublicServices(limit = 50) {
  return useQuery({
    queryKey: ["public", "services", limit],
    queryFn: () => fetchServices(limit),
    staleTime: 300_000,
  });
}

export function usePublicReports(limit = 20) {
  return useQuery({
    queryKey: ["public", "reports", limit],
    queryFn: () => fetchReports(limit),
    staleTime: 120_000,
  });
}

export function usePublicReport(slug: string | undefined) {
  return useQuery({
    queryKey: ["public", "reports", "detail", slug],
    queryFn: () => fetchReportBySlug(slug!),
    enabled: Boolean(slug),
    staleTime: 120_000,
  });
}

export function usePublicEvents(limit = 20, when: PublicEventsWhen = "all") {
  return useQuery({
    queryKey: ["public", "events", limit, when],
    queryFn: () => fetchEvents(limit, when),
    staleTime: 120_000,
  });
}

export function usePublicLeadership() {
  return useQuery({
    queryKey: ["public", "leadership"],
    queryFn: fetchLeadership,
    staleTime: 600_000,
  });
}

export function usePublicPresident() {
  return useQuery({
    queryKey: ["public", "president"],
    queryFn: fetchPresident,
    staleTime: 300_000,
  });
}

export function usePublicProjects(limit = 50) {
  return useQuery({
    queryKey: ["public", "projects", limit],
    queryFn: () => fetchProjects(limit),
    staleTime: 300_000,
  });
}

export function usePublicProject(slug: string | undefined) {
  return useQuery({
    queryKey: ["public", "projects", "slug", slug],
    queryFn: () => fetchProjectBySlug(slug!),
    enabled: Boolean(slug),
    staleTime: 300_000,
    retry: (count, err) => {
      if (err instanceof ApiError && err.status === 404) return false;
      return count < 2;
    },
  });
}

export function useMapDistricts() {
  return useQuery({
    queryKey: ["public", "map-districts"],
    queryFn: fetchMapDistricts,
    staleTime: 300_000,
  });
}

export function usePublicGeo(category?: string) {
  return useQuery({
    queryKey: ["public", "geo", "all", category],
    queryFn: () => fetchAllGeoIndications(category),
    staleTime: 300_000,
  });
}

export function useCorporate() {
  return useQuery({
    queryKey: ["public", "corporate"],
    queryFn: fetchCorporate,
    staleTime: 300_000,
  });
}

export function usePublicCorporateDocuments() {
  return useQuery({
    queryKey: ["public", "corporate", "documents"],
    queryFn: fetchCorporateDocuments,
    staleTime: 300_000,
  });
}

export function usePublicCorporateDocument(slug: string | undefined) {
  return useQuery({
    queryKey: ["public", "corporate", "documents", slug],
    queryFn: () => fetchCorporateDocumentBySlug(slug!),
    enabled: Boolean(slug),
    staleTime: 300_000,
    retry: (count, err) => {
      if (err instanceof ApiError && err.status === 404) return false;
      return count < 2;
    },
  });
}

export function usePublicServiceAgreements() {
  return useQuery({
    queryKey: ["public", "services", "agreements"],
    queryFn: fetchServiceAgreements,
    staleTime: 300_000,
  });
}

export function usePublicServiceAgreement(slug: string | undefined) {
  return useQuery({
    queryKey: ["public", "services", "agreements", slug],
    queryFn: () => fetchServiceAgreementBySlug(slug!),
    enabled: Boolean(slug),
    staleTime: 300_000,
    retry: (count, err) => {
      if (err instanceof ApiError && err.status === 404) return false;
      return count < 2;
    },
  });
}

export function useHero() {
  return useQuery({
    queryKey: ["public", "hero"],
    queryFn: fetchHero,
    staleTime: 300_000,
  });
}

export function usePublicStatsByGroup(group?: string) {
  return useQuery({
    queryKey: ["public", "stats", group ?? "default"],
    queryFn: () => fetchStats(group),
    staleTime: 300_000,
  });
}

export function useSiteContact() {
  return useQuery({
    queryKey: ["public", "site", "contact"],
    queryFn: fetchSiteContact,
    staleTime: 300_000,
  });
}

export function useLegalPage(slug: string | undefined) {
  return useQuery({
    queryKey: ["public", "legal", slug],
    queryFn: () => fetchLegalPage(slug!),
    enabled: Boolean(slug),
    staleTime: 300_000,
  });
}

export function usePublicEvent(slug: string | undefined) {
  return useQuery({
    queryKey: ["public", "events", "slug", slug],
    queryFn: () => fetchEventBySlug(slug!),
    enabled: Boolean(slug),
    staleTime: 120_000,
  });
}

export function usePublicGeoItem(slug: string | undefined) {
  return useQuery({
    queryKey: ["public", "geo", "slug", slug],
    queryFn: () => fetchGeoBySlug(slug!),
    enabled: Boolean(slug),
    staleTime: 300_000,
  });
}

