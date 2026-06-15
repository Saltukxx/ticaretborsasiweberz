/**
 * Public API client for the Erzurum Ticaret Borsası backend.
 * Assembles requests to VITE_API_URL/api/v1/... and parses
 * the standard { data, meta? } envelope.
 */
import type { HeroContent } from "../data/hero-defaults";

function getBase(): string {
  const configured = import.meta.env.VITE_API_URL as string | undefined;
  // Dev + production nginx: API is proxied on the same host (avoids Chrome insecure-download warnings).
  if (typeof window !== "undefined") {
    if (import.meta.env.DEV || import.meta.env.VITE_SAME_ORIGIN_API === "true") {
      return window.location.origin;
    }
    if (configured?.trim()) return configured.replace(/\/$/, "");
    return window.location.origin;
  }
  if (configured?.trim()) return configured.replace(/\/$/, "");
  throw new Error("VITE_API_URL is not set");
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function fetchJSON<T>(path: string): Promise<T> {
  const url = `${getBase()}/api/v1${path}`;
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
  });
  const json = (await res.json()) as
    | { data: T }
    | { error: { code: string; message: string } };

  if (!res.ok || "error" in json) {
    const err = "error" in json ? json.error : { code: "UNKNOWN", message: res.statusText };
    throw new ApiError(res.status, err.code, err.message);
  }

  return (json as { data: T }).data;
}

// ─── Announcements ───────────────────────────────────────────────────────────

export interface TickerAnnouncement {
  id: string;
  slug: string;
  title: string;
  body: string | null;
  priority: number;
  publishedAt: string | null;
  expiresAt: string | null;
}

export interface PublicAnnouncement extends TickerAnnouncement {
  isTicker: boolean;
}

export function fetchAnnouncementsTicker(): Promise<TickerAnnouncement[]> {
  return fetchJSON<TickerAnnouncement[]>("/announcements/ticker");
}

export function fetchAnnouncements(limit = 20, offset = 0): Promise<PublicAnnouncement[]> {
  return fetchJSON<{ data: PublicAnnouncement[]; meta: unknown }>(`/announcements?limit=${limit}&offset=${offset}`)
    .then((r) => (r as unknown as { data: PublicAnnouncement[] }).data)
    .catch(() => fetchJSON<PublicAnnouncement[]>(`/announcements?limit=${limit}&offset=${offset}`));
}

export type PublicAnnouncementsPage = {
  items: PublicAnnouncement[];
  total: number;
  limit: number;
  offset: number;
};

export async function fetchAnnouncementsListPage(
  limit = 20,
  offset = 0,
): Promise<PublicAnnouncementsPage> {
  const res = await fetch(
    `${getBase()}/api/v1/announcements?limit=${limit}&offset=${offset}`,
    { headers: { Accept: "application/json" } },
  );
  const json = (await res.json()) as {
    data: PublicAnnouncement[];
    meta?: { total?: number; limit?: number; offset?: number };
  };
  return {
    items: json.data ?? [],
    total: json.meta?.total ?? json.data?.length ?? 0,
    limit: json.meta?.limit ?? limit,
    offset: json.meta?.offset ?? offset,
  };
}

// Simpler wrapper that handles the envelope shape properly:
export async function fetchAnnouncementsList(limit = 20, offset = 0): Promise<PublicAnnouncement[]> {
  const page = await fetchAnnouncementsListPage(limit, offset);
  return page.items;
}

// ─── News ─────────────────────────────────────────────────────────────────────

export interface PublicNewsItem {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  category: string | null;
  tone: string | null;
  isFeatured: boolean;
  coverImage: string | null;
  coverUrl: string | null;
  publishedAt: string | null;
}

export type PublicNewsListPage = {
  items: PublicNewsItem[];
  total: number;
  limit: number;
  offset: number;
};

export async function fetchNewsListPage(
  limit = 20,
  offset = 0,
): Promise<PublicNewsListPage> {
  const res = await fetch(
    `${getBase()}/api/v1/news?limit=${limit}&offset=${offset}`,
    { headers: { Accept: "application/json" } },
  );
  const json = (await res.json()) as {
    data: PublicNewsItem[];
    meta?: { total?: number; limit?: number; offset?: number };
  };
  return {
    items: json.data ?? [],
    total: json.meta?.total ?? json.data?.length ?? 0,
    limit: json.meta?.limit ?? limit,
    offset: json.meta?.offset ?? offset,
  };
}

export async function fetchNewsList(limit = 20, offset = 0): Promise<PublicNewsItem[]> {
  const page = await fetchNewsListPage(limit, offset);
  return page.items;
}

export interface PublicNewsDetail extends PublicNewsItem {
  body: string;
}

/** Türkçe tam metin arama (başlık/özet/gövde). En az 2 karakter gerekir. */
export async function searchNews(
  q: string,
  limit = 8,
): Promise<{ rows: PublicNewsItem[]; total: number }> {
  const params = new URLSearchParams({ q, limit: String(limit) });
  const res = await fetch(`${getBase()}/api/v1/news/search?${params}`, {
    headers: { Accept: "application/json" },
  });
  const json = (await res.json()) as
    | { data: PublicNewsItem[]; meta: { total: number } }
    | { error: { code: string; message: string } };
  if (!res.ok || "error" in json) {
    const err = "error" in json ? json.error : { code: "UNKNOWN", message: res.statusText };
    throw new ApiError(res.status, err.code, err.message);
  }
  return { rows: json.data, total: json.meta.total };
}

export async function fetchNewsBySlug(slug: string): Promise<PublicNewsDetail> {
  return fetchJSON<PublicNewsDetail>(`/news/${encodeURIComponent(slug)}`);
}

export interface PublicAnnouncementDetail extends PublicAnnouncement {
  createdAt: string;
  updatedAt: string;
}

export async function fetchAnnouncementBySlug(slug: string): Promise<PublicAnnouncementDetail> {
  return fetchJSON<PublicAnnouncementDetail>(`/announcements/${encodeURIComponent(slug)}`);
}

// ─── Currency Rates ───────────────────────────────────────────────────────────

export interface PublicCurrencyRate {
  id: string;
  code: string;
  label: string | null;
  rateValue: number;
  changePct: number | null;
  direction: number | null;
  recordedAt: string | null;
}

export function fetchCurrencyRates(): Promise<PublicCurrencyRate[]> {
  return fetchJSON<PublicCurrencyRate[]>("/currency-rates");
}

// ─── Market ticker (BIST, FX, gold) ───────────────────────────────────────────

export type MarketTickerUnit = "try" | "index" | "fx";

export interface MarketTickerItem {
  code: string;
  label: string;
  value: number;
  changePct: number | null;
  direction: number | null;
  unit: MarketTickerUnit;
}

export interface MarketTickerPayload {
  items: MarketTickerItem[];
  source: "live" | "fallback";
  updatedAt: string | null;
}

export function fetchMarketTicker(): Promise<MarketTickerPayload> {
  return fetchJSON<MarketTickerPayload>("/market-ticker");
}

// ─── Prices ───────────────────────────────────────────────────────────────────

export interface CurrentPriceRow {
  entry_id: string | null;
  product_id: string;
  product_slug: string;
  product_name: string;
  product_category: string;
  product_unit: string;
  avg_price: number | null;
  low_price: number | null;
  high_price: number | null;
  change_pct: number | null;
  volume: number | null;
  volume_unit: string | null;
  transaction_amount: number | null;
  transaction_count: number | null;
  entry_date: string | null;
  session_time: string | null;
  sparkline_series: number[] | null;
  sort_order: number;
}

export function fetchCurrentPrices(): Promise<CurrentPriceRow[]> {
  return fetchJSON<CurrentPriceRow[]>("/prices/current");
}

export type PriceHistoryPeriod = "7d" | "30d" | "90d" | "365d";

export interface PriceHistoryPoint {
  id: string;
  entry_date: string | null;
  avg_price: number | null;
  low_price: number | null;
  high_price: number | null;
  change_pct: number | null;
  volume: number | null;
  volume_unit: string | null;
  session_time: string | null;
}

const PRICE_PERIOD_ORDER: PriceHistoryPeriod[] = ["7d", "30d", "90d", "365d"];

export interface PriceHistoryResult {
  points: PriceHistoryPoint[];
  /** Verinin gerçekte hangi dönemden geldiği (fallback genişletmesi sonrası). */
  effectivePeriod: PriceHistoryPeriod;
}

/**
 * Seçilen dönemde çizgi çizmeye yetecek veri (≥2 nokta) yoksa bir sonraki
 * geniş döneme düşerek dener (7d → 30d → 90d → 365d). Seyrek işlem gören
 * ürünlerde grafiğin tek nokta olarak kalmasını önler.
 */
export async function fetchPriceHistoryWithFallback(
  productSlug: string,
  period: PriceHistoryPeriod,
): Promise<PriceHistoryResult> {
  let idx = Math.max(0, PRICE_PERIOD_ORDER.indexOf(period));
  let points = await fetchPriceHistory(productSlug, PRICE_PERIOD_ORDER[idx]);
  let effectivePeriod = PRICE_PERIOD_ORDER[idx];

  while (points.length < 2 && idx < PRICE_PERIOD_ORDER.length - 1) {
    idx += 1;
    const wider = await fetchPriceHistory(productSlug, PRICE_PERIOD_ORDER[idx]);
    if (wider.length > points.length) {
      points = wider;
      effectivePeriod = PRICE_PERIOD_ORDER[idx];
    }
    if (points.length >= 2) break;
  }

  return { points, effectivePeriod };
}

export function fetchPriceHistory(
  productSlug: string,
  period: PriceHistoryPeriod,
): Promise<PriceHistoryPoint[]> {
  const params = new URLSearchParams({ period });
  return fetchJSON<PriceHistoryPoint[]>(
    `/prices/history/${encodeURIComponent(productSlug)}?${params}`,
  );
}

export interface PriceBulletinPayload {
  sessionDate: string | null;
  rows: (CurrentPriceRow & { session_date?: string | null })[];
}

export function fetchPriceBulletin(): Promise<PriceBulletinPayload> {
  return fetchJSON<PriceBulletinPayload>("/prices/bulletin");
}

// ─── External exchange bulletins ─────────────────────────────────────────────

export interface ExternalBulletinRow {
  productName: string;
  category: string;
  saleType: string | null;
  lowPrice: number;
  highPrice: number;
  avgPrice: number;
  volume: number | null;
  volumeUnit: string | null;
  transactionAmount: number | null;
  transactionCount: number | null;
}

export interface ExternalBulletinSource {
  id: string;
  name: string;
  shortName: string;
  sourceUrl: string;
  sessionDate: string | null;
  fetchedAt: string;
  status: "ok" | "error";
  errorMessage?: string;
  rows: ExternalBulletinRow[];
}

export interface ExternalBulletinsPayload {
  fetchedAt: string;
  sessionDate: string;
  sources: ExternalBulletinSource[];
}

export function fetchExternalBulletins(): Promise<ExternalBulletinsPayload> {
  return fetchJSON<ExternalBulletinsPayload>("/prices/external-bulletins");
}

// ─── Stats ────────────────────────────────────────────────────────────────────

export interface PublicStat {
  id: string;
  label: string;
  value: string;
  suffix: string | null;
  note: string | null;
  groupKey: string | null;
  sortOrder: number;
}

export function fetchStats(group?: string): Promise<PublicStat[]> {
  const params = group ? `?group=${encodeURIComponent(group)}` : "";
  return fetchJSON<PublicStat[]>(`/stats${params}`);
}

// ─── Services ─────────────────────────────────────────────────────────────────

export interface PublicService {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  icon: string | null;
  sortOrder: number;
}

export async function fetchServices(limit = 50): Promise<PublicService[]> {
  const res = await fetch(
    `${getBase()}/api/v1/services?limit=${limit}`,
    { headers: { Accept: "application/json" } },
  );
  const json = (await res.json()) as { data: PublicService[] };
  return json.data ?? [];
}

// ─── Reports ──────────────────────────────────────────────────────────────────

export interface PublicReport {
  id: string;
  slug: string;
  name: string;
  summary: string | null;
  type: string | null;
  periodLabel: string | null;
  reportDate: string | null;
}

/** Detail row from GET /reports/:slug (includes PDF URL when linked media exists). */
export interface PublicReportDetail extends PublicReport {
  fileId: string;
  fileUrl: string;
  fileMimeType: string | null;
  fileOriginalName: string | null;
}

export function fetchReportBySlug(slug: string): Promise<PublicReportDetail> {
  return fetchJSON<PublicReportDetail>(`/reports/${encodeURIComponent(slug)}`);
}

/** Same-origin path — do not point downloads at :3001 or /uploads (Chrome flags cross-origin HTTP). */
export function reportDownloadPath(slug: string, inline = false): string {
  const q = inline ? "?inline=1" : "";
  return `/api/v1/reports/${encodeURIComponent(slug)}/download${q}`;
}

export function reportDownloadUrl(slug: string, inline = false): string {
  return reportDownloadPath(slug, inline);
}

export async function fetchReports(limit = 20): Promise<PublicReport[]> {
  const res = await fetch(
    `${getBase()}/api/v1/reports?limit=${limit}`,
    { headers: { Accept: "application/json" } },
  );
  const json = (await res.json()) as { data: PublicReport[] };
  return json.data ?? [];
}

// ─── Leadership ───────────────────────────────────────────────────────────────

export type LeadershipGroupKey =
  | "yonetim_kurulu"
  | "meclis"
  | "tobb_delegeleri"
  | "personel"
  | "danisman";

export interface PublicLeader {
  id: string;
  roleKey: string;
  groupKey?: LeadershipGroupKey | string;
  name: string;
  title: string;
  messageTitle: string | null;
  eyebrow: string | null;
  quoteLines: string[] | null;
  portraitId: string | null;
  portraitUrl: string | null;
  sortOrder: number;
}

export async function fetchLeadership(): Promise<PublicLeader[]> {
  const res = await fetch(
    `${getBase()}/api/v1/leadership`,
    { headers: { Accept: "application/json" } },
  );
  const json = (await res.json()) as { data: PublicLeader[] };
  return json.data ?? [];
}

export async function fetchPresident(): Promise<PublicLeader | null> {
  try {
    return await fetchJSON<PublicLeader>("/leadership/president");
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}

// ─── Events ───────────────────────────────────────────────────────────────────

export interface PublicEvent {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  location: string | null;
  startsAt: string | null;
  endsAt: string | null;
  coverImage: string | null;
  registrationOpen: boolean;
  isStakeholder: boolean;
  statusLabel: string | null;
}

export type PublicEventsWhen = "all" | "upcoming" | "past";

export async function fetchEvents(
  limit = 20,
  when: PublicEventsWhen = "all",
): Promise<PublicEvent[]> {
  const params = new URLSearchParams({ limit: String(limit), when });
  const res = await fetch(
    `${getBase()}/api/v1/events?${params}`,
    { headers: { Accept: "application/json" } },
  );
  const json = (await res.json()) as { data: PublicEvent[] };
  return json.data ?? [];
}

export interface PublicEventDetail extends PublicEvent {
  coverUrl?: string | null;
  isPublished?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export async function fetchEventBySlug(slug: string): Promise<PublicEventDetail> {
  return fetchJSON<PublicEventDetail>(`/events/${encodeURIComponent(slug)}`);
}

// ─── Projects ─────────────────────────────────────────────────────────────────

export type ProjectPhase = { label: string; done: boolean };
export type ProjectMetric = { value: string; label: string };
export type ProjectIcon = "digital" | "data" | "lab";
export type ProjectStatus = "ongoing" | "completed";

export interface PublicProject {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  hasBody?: boolean;
  status: ProjectStatus;
  field: string | null;
  progress: number | null;
  targetLabel: string | null;
  phaseLabel: string | null;
  phases: ProjectPhase[];
  outputs: string[];
  icon: ProjectIcon | null;
  year: string | null;
  impact: string | null;
  result: string | null;
  metric: ProjectMetric | null;
  sortOrder: number;
  startedAt: string | null;
  completedAt: string | null;
  coverImage: string | null;
  coverUrl: string | null;
}

export interface PublicProjectDetail extends PublicProject {
  body: string | null;
  createdAt: string;
  updatedAt: string;
}

export async function fetchProjects(limit = 50, status?: string): Promise<PublicProject[]> {
  const params = new URLSearchParams({ limit: String(limit), offset: "0" });
  if (status) params.set("status", status);
  const res = await fetch(`${getBase()}/api/v1/projects?${params}`, {
    headers: { Accept: "application/json" },
  });
  const json = (await res.json()) as { data: PublicProject[] };
  return json.data ?? [];
}

export async function fetchProjectBySlug(slug: string): Promise<PublicProjectDetail> {
  const res = await fetch(`${getBase()}/api/v1/projects/${encodeURIComponent(slug)}`, {
    headers: { Accept: "application/json" },
  });
  const json = (await res.json()) as
    | { data: PublicProjectDetail }
    | { error: { code: string; message: string } };
  if (!res.ok || "error" in json) {
    const err = "error" in json ? json.error : { code: "UNKNOWN", message: res.statusText };
    throw new ApiError(res.status, err.code, err.message);
  }
  return json.data;
}

// ─── Map districts ────────────────────────────────────────────────────────────

export interface PublicMapDistrict {
  slug: string;
  label: string;
  productLine: string;
  dailyVolume: string;
  memberCount: number;
  registrationCount: number;
  sortOrder: number;
}

export async function fetchMapDistricts(): Promise<PublicMapDistrict[]> {
  const res = await fetch(`${getBase()}/api/v1/map-districts`, {
    headers: { Accept: "application/json" },
  });
  const json = (await res.json()) as { data: PublicMapDistrict[] };
  return json.data ?? [];
}

// ─── Geographical indications ─────────────────────────────────────────────────

export interface PublicGeoIndication {
  id: string;
  slug: string;
  name: string;
  category: string;
  type: string;
  registrationNo: string | null;
  registeredAt: string | null;
  district: string | null;
  isHighlight: boolean;
  story: string | null;
  sortOrder: number;
  coverImage: string | null;
  coverUrl: string | null;
}

type GeoListResponse = {
  data: PublicGeoIndication[];
  meta: { total: number; limit: number; offset: number };
};

async function fetchGeoIndicationsPage(
  limit: number,
  offset: number,
  category?: string,
): Promise<GeoListResponse> {
  const capped = Math.min(Math.max(limit, 1), 200);
  const params = new URLSearchParams({
    limit: String(capped),
    offset: String(offset),
  });
  if (category) params.set("category", category);
  const res = await fetch(`${getBase()}/api/v1/geo-indications?${params}`, {
    headers: { Accept: "application/json" },
  });
  const json = (await res.json()) as
    | GeoListResponse
    | { error: { code: string; message: string } };

  if (!res.ok || "error" in json) {
    const err = "error" in json ? json.error : { code: "UNKNOWN", message: res.statusText };
    throw new ApiError(res.status, err.code, err.message);
  }
  return json;
}

/** Fetches one page (max 200 per request). */
export async function fetchGeoIndications(
  limit = 100,
  category?: string,
): Promise<PublicGeoIndication[]> {
  const { data } = await fetchGeoIndicationsPage(limit, 0, category);
  return data;
}

/** Loads the full published catalog (paginates when total > page size). */
export async function fetchAllGeoIndications(category?: string): Promise<PublicGeoIndication[]> {
  const pageSize = 100;
  const first = await fetchGeoIndicationsPage(pageSize, 0, category);
  const all = [...first.data];
  let offset = first.data.length;
  while (all.length < first.meta.total && first.data.length === pageSize) {
    const next = await fetchGeoIndicationsPage(pageSize, offset, category);
    all.push(...next.data);
    offset += next.data.length;
    if (next.data.length === 0) break;
  }
  return all;
}

export async function fetchGeoBySlug(slug: string): Promise<PublicGeoIndication> {
  return fetchJSON<PublicGeoIndication>(`/geo-indications/${encodeURIComponent(slug)}`);
}

// ─── Corporate ────────────────────────────────────────────────────────────────

export interface PublicCorporateProfile {
  id: string;
  eyebrow: string;
  heading: string;
  lead: string;
  mission: string;
  vision: string;
}

export interface PublicCorporateMilestone {
  id: string;
  year: string;
  title: string;
  description: string;
  sortOrder: number;
}

export interface PublicCorporatePayload {
  profile: PublicCorporateProfile;
  milestones: PublicCorporateMilestone[];
}

export async function fetchCorporate(): Promise<PublicCorporatePayload> {
  const res = await fetch(`${getBase()}/api/v1/corporate`, {
    headers: { Accept: "application/json" },
  });
  const json = (await res.json()) as { data: PublicCorporatePayload };
  return json.data;
}

export type CorporateDocumentCategory =
  | "politika"
  | "tarihce"
  | "plan"
  | "organizasyon";

export interface PublicCorporateDocument {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  category: CorporateDocumentCategory | string;
  sortOrder: number;
}

export interface PublicCorporateDocumentDetail extends PublicCorporateDocument {
  body: string | null;
  fileId: string;
  fileUrl: string;
  fileMimeType: string | null;
  fileOriginalName: string | null;
}

export async function fetchCorporateDocuments(): Promise<PublicCorporateDocument[]> {
  const res = await fetch(`${getBase()}/api/v1/corporate/documents`, {
    headers: { Accept: "application/json" },
  });
  const json = (await res.json()) as { data: PublicCorporateDocument[] };
  return json.data ?? [];
}

export function fetchCorporateDocumentBySlug(
  slug: string,
): Promise<PublicCorporateDocumentDetail> {
  return fetchJSON<PublicCorporateDocumentDetail>(
    `/corporate/documents/${encodeURIComponent(slug)}`,
  );
}

export function corporateDocumentDownloadPath(slug: string, inline = false): string {
  const q = inline ? "?inline=1" : "";
  return `/api/v1/corporate/documents/${encodeURIComponent(slug)}/download${q}`;
}

export function corporateDocumentDownloadUrl(slug: string, inline = false): string {
  return corporateDocumentDownloadPath(slug, inline);
}

// ─── Service agreements (Hizmetler → Anlaşmalarımız) ─────────────────────────

export interface PublicServiceAgreement {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  category: string;
  sortOrder: number;
}

export interface PublicServiceAgreementDetail extends PublicServiceAgreement {
  body: string;
}

export async function fetchServiceAgreements(): Promise<PublicServiceAgreement[]> {
  const res = await fetch(`${getBase()}/api/v1/services/agreements`, {
    headers: { Accept: "application/json" },
  });
  const json = (await res.json()) as { data: PublicServiceAgreement[] };
  return json.data ?? [];
}

export function fetchServiceAgreementBySlug(
  slug: string,
): Promise<PublicServiceAgreementDetail> {
  return fetchJSON<PublicServiceAgreementDetail>(
    `/services/agreements/${encodeURIComponent(slug)}`,
  );
}

// ─── Hero (homepage) ─────────────────────────────────────────────────────────

export type { HeroContent, HeroKpi } from "../data/hero-defaults";

export async function fetchHero(): Promise<HeroContent> {
  return fetchJSON<HeroContent>("/hero");
}

// ─── Site contact, legal, forms ───────────────────────────────────────────────

export interface PublicSiteContact {
  address: string | null;
  phone: string | null;
  fax: string | null;
  emailPrimary: string | null;
  emailSecondary: string | null;
  hours: string | null;
  socialLinkedin: string | null;
  socialX: string | null;
  socialYoutube: string | null;
  socialInstagram: string | null;
}

export interface PublicLegalPage {
  slug: string;
  title: string;
  body: string;
  isPublished: boolean;
  updatedAt: string;
}

export function fetchSiteContact(): Promise<PublicSiteContact> {
  return fetchJSON<PublicSiteContact>("/site/contact");
}

export function fetchLegalPage(slug: string): Promise<PublicLegalPage> {
  return fetchJSON<PublicLegalPage>(`/legal/${encodeURIComponent(slug)}`);
}

export async function submitContactForm(body: {
  fullName: string;
  organization?: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}): Promise<{ id: string }> {
  const res = await fetch(`${getBase()}/api/v1/contact`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
  });
  const json = (await res.json()) as
    | { data: { id: string } }
    | { error: { code: string; message: string } };
  if (!res.ok || "error" in json) {
    const err = "error" in json ? json.error : { code: "UNKNOWN", message: res.statusText };
    throw new ApiError(res.status, err.code, err.message);
  }
  return json.data;
}

export async function unsubscribeNewsletter(body: {
  email: string;
  token: string;
}): Promise<{ ok: true }> {
  const res = await fetch(`${getBase()}/api/v1/newsletter/unsubscribe`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
  });
  const json = (await res.json()) as
    | { data: { ok: true } }
    | { error: { code: string; message: string } };
  if (!res.ok || "error" in json) {
    const err = "error" in json ? json.error : { code: "UNKNOWN", message: res.statusText };
    throw new ApiError(res.status, err.code, err.message);
  }
  return json.data;
}

export type NewsletterFrequency = "daily" | "weekly" | "monthly";

export async function subscribeNewsletter(body: {
  email: string;
  frequency: NewsletterFrequency;
}): Promise<{ id: string; email: string }> {
  const res = await fetch(`${getBase()}/api/v1/newsletter/subscribe`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
  });
  const json = (await res.json()) as
    | { data: { id: string; email: string } }
    | { error: { code: string; message: string } };
  if (!res.ok || "error" in json) {
    const err = "error" in json ? json.error : { code: "UNKNOWN", message: res.statusText };
    throw new ApiError(res.status, err.code, err.message);
  }
  return json.data;
}

