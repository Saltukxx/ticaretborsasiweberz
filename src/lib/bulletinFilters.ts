import type { CurrentPriceRow } from "./publicApi";
import { hasChangePct, saleTypeFromProductName } from "./priceDisplay";

export const CATEGORY_ALL = "Tümü";

export type VolumeFilter = "all" | "has" | "1t" | "5t" | "10t";
export type AmountFilter = "all" | "has" | "50k" | "250k" | "1m";
export type CountFilter = "all" | "has" | "5" | "10";
export type ChangeFilter = "all" | "up" | "down" | "flat";
export type BulletinSortKey =
  | "default"
  | "name-asc"
  | "avg-desc"
  | "avg-asc"
  | "volume-desc"
  | "amount-desc"
  | "change-desc"
  | "count-desc";

export type BulletinFilterState = {
  query: string;
  category: string;
  saleType: string;
  volumeFilter: VolumeFilter;
  amountFilter: AmountFilter;
  countFilter: CountFilter;
  changeFilter: ChangeFilter;
  sort: BulletinSortKey;
};

export const DEFAULT_BULLETIN_FILTERS: BulletinFilterState = {
  query: "",
  category: CATEGORY_ALL,
  saleType: CATEGORY_ALL,
  volumeFilter: "all",
  amountFilter: "all",
  countFilter: "all",
  changeFilter: "all",
  /** Varsayılan sıra: işlem adedi (yüksek → düşük) */
  sort: "default",
};

export const VOLUME_FILTER_OPTIONS: { value: VolumeFilter; label: string }[] = [
  { value: "all", label: "Tümü" },
  { value: "has", label: "Miktar var" },
  { value: "1t", label: "1 ton+" },
  { value: "5t", label: "5 ton+" },
  { value: "10t", label: "10 ton+" },
];

export const AMOUNT_FILTER_OPTIONS: { value: AmountFilter; label: string }[] = [
  { value: "all", label: "Tümü" },
  { value: "has", label: "Tutar var" },
  { value: "50k", label: "50 bin ₺+" },
  { value: "250k", label: "250 bin ₺+" },
  { value: "1m", label: "1 milyon ₺+" },
];

export const COUNT_FILTER_OPTIONS: { value: CountFilter; label: string }[] = [
  { value: "all", label: "Tümü" },
  { value: "has", label: "İşlem var" },
  { value: "5", label: "5+" },
  { value: "10", label: "10+" },
];

export const CHANGE_FILTER_OPTIONS: { value: ChangeFilter; label: string }[] = [
  { value: "all", label: "Tümü" },
  { value: "up", label: "Yükselen" },
  { value: "down", label: "Düşen" },
  { value: "flat", label: "Sabit" },
];

export const SORT_OPTIONS: { value: BulletinSortKey; label: string }[] = [
  { value: "default", label: "İşlem adedi" },
  { value: "name-asc", label: "Ada göre (A→Z)" },
  { value: "avg-desc", label: "Ort. fiyat (yüksek)" },
  { value: "avg-asc", label: "Ort. fiyat (düşük)" },
  { value: "volume-desc", label: "İşlem miktarı" },
  { value: "amount-desc", label: "İşlem tutarı" },
  { value: "change-desc", label: "Değişim %" },
];

function normalizeQuery(q: string): string {
  return q.trim().toLocaleLowerCase("tr");
}

function matchesQuery(p: CurrentPriceRow, query: string): boolean {
  if (!query) return true;
  const hay = `${p.product_name} ${p.product_category}`.toLocaleLowerCase("tr");
  return hay.includes(query);
}

function matchesCategory(p: CurrentPriceRow, category: string): boolean {
  return category === CATEGORY_ALL || p.product_category === category;
}

function matchesSaleType(p: CurrentPriceRow, saleType: string): boolean {
  if (saleType === CATEGORY_ALL) return true;
  return saleTypeFromProductName(p.product_name) === saleType;
}

function volumeThreshold(filter: VolumeFilter): number | null {
  switch (filter) {
    case "1t":
      return 1000;
    case "5t":
      return 5000;
    case "10t":
      return 10000;
    default:
      return null;
  }
}

function matchesVolume(p: CurrentPriceRow, filter: VolumeFilter): boolean {
  switch (filter) {
    case "all":
      return true;
    case "has":
      return p.volume != null && p.volume > 0;
    default: {
      const min = volumeThreshold(filter);
      return min != null && p.volume != null && p.volume >= min;
    }
  }
}

function amountThreshold(filter: AmountFilter): number | null {
  switch (filter) {
    case "50k":
      return 50_000;
    case "250k":
      return 250_000;
    case "1m":
      return 1_000_000;
    default:
      return null;
  }
}

function matchesAmount(p: CurrentPriceRow, filter: AmountFilter): boolean {
  switch (filter) {
    case "all":
      return true;
    case "has":
      return p.transaction_amount != null && p.transaction_amount > 0;
    default: {
      const min = amountThreshold(filter);
      return min != null && p.transaction_amount != null && p.transaction_amount >= min;
    }
  }
}

function countThreshold(filter: CountFilter): number | null {
  switch (filter) {
    case "5":
      return 5;
    case "10":
      return 10;
    default:
      return null;
  }
}

function matchesCount(p: CurrentPriceRow, filter: CountFilter): boolean {
  switch (filter) {
    case "all":
      return true;
    case "has":
      return p.transaction_count != null && p.transaction_count > 0;
    default: {
      const min = countThreshold(filter);
      return min != null && p.transaction_count != null && p.transaction_count >= min;
    }
  }
}

function matchesChange(p: CurrentPriceRow, filter: ChangeFilter): boolean {
  switch (filter) {
    case "all":
      return true;
    case "up":
      return hasChangePct(p.change_pct) && p.change_pct > 0;
    case "down":
      return hasChangePct(p.change_pct) && p.change_pct < 0;
    case "flat":
      return !hasChangePct(p.change_pct) || p.change_pct === 0;
  }
}

export function compareByVolumeDesc(a: CurrentPriceRow, b: CurrentPriceRow): number {
  const volumeDiff = (b.volume ?? -Infinity) - (a.volume ?? -Infinity);
  if (volumeDiff !== 0) return volumeDiff;
  const amountDiff =
    (b.transaction_amount ?? -Infinity) - (a.transaction_amount ?? -Infinity);
  if (amountDiff !== 0) return amountDiff;
  return a.product_name.localeCompare(b.product_name, "tr");
}

export function compareByCountDesc(a: CurrentPriceRow, b: CurrentPriceRow): number {
  const countDiff = (b.transaction_count ?? -Infinity) - (a.transaction_count ?? -Infinity);
  if (countDiff !== 0) return countDiff;
  const volumeDiff = (b.volume ?? -Infinity) - (a.volume ?? -Infinity);
  if (volumeDiff !== 0) return volumeDiff;
  const amountDiff =
    (b.transaction_amount ?? -Infinity) - (a.transaction_amount ?? -Infinity);
  if (amountDiff !== 0) return amountDiff;
  return a.product_name.localeCompare(b.product_name, "tr");
}

function sortRows(rows: CurrentPriceRow[], sort: BulletinSortKey): CurrentPriceRow[] {
  const copy = [...rows];
  switch (sort) {
    case "name-asc":
      return copy.sort((a, b) => a.product_name.localeCompare(b.product_name, "tr"));
    case "avg-desc":
      return copy.sort((a, b) => (b.avg_price ?? -Infinity) - (a.avg_price ?? -Infinity));
    case "avg-asc":
      return copy.sort((a, b) => (a.avg_price ?? Infinity) - (b.avg_price ?? Infinity));
    case "volume-desc":
      return copy.sort(compareByVolumeDesc);
    case "amount-desc":
      return copy.sort(
        (a, b) => (b.transaction_amount ?? -Infinity) - (a.transaction_amount ?? -Infinity),
      );
    case "change-desc":
      return copy.sort((a, b) => (b.change_pct ?? -Infinity) - (a.change_pct ?? -Infinity));
    case "count-desc":
    case "default":
      return copy.sort(compareByCountDesc);
    default:
      return copy.sort(compareByCountDesc);
  }
}

export function extractCategories(products: CurrentPriceRow[]): string[] {
  return [
    CATEGORY_ALL,
    ...Array.from(new Set(products.map((p) => p.product_category).filter(Boolean))).sort((a, b) =>
      a.localeCompare(b, "tr"),
    ),
  ];
}

export function extractSaleTypes(products: CurrentPriceRow[]): string[] {
  const types = new Set<string>();
  for (const p of products) {
    const st = saleTypeFromProductName(p.product_name);
    if (st) types.add(st);
  }
  return [CATEGORY_ALL, ...Array.from(types).sort((a, b) => a.localeCompare(b, "tr"))];
}

export function applyBulletinFilters(
  products: CurrentPriceRow[],
  filters: BulletinFilterState,
): CurrentPriceRow[] {
  const query = normalizeQuery(filters.query);
  const filtered = products.filter(
    (p) =>
      matchesQuery(p, query) &&
      matchesCategory(p, filters.category) &&
      matchesSaleType(p, filters.saleType) &&
      matchesVolume(p, filters.volumeFilter) &&
      matchesAmount(p, filters.amountFilter) &&
      matchesCount(p, filters.countFilter) &&
      matchesChange(p, filters.changeFilter),
  );
  return sortRows(filtered, filters.sort);
}

export function countActiveBulletinFilters(filters: BulletinFilterState): number {
  let n = 0;
  if (filters.query.trim()) n += 1;
  if (filters.category !== CATEGORY_ALL) n += 1;
  if (filters.saleType !== CATEGORY_ALL) n += 1;
  if (filters.volumeFilter !== "all") n += 1;
  if (filters.amountFilter !== "all") n += 1;
  if (filters.countFilter !== "all") n += 1;
  if (filters.changeFilter !== "all") n += 1;
  if (filters.sort !== "default") n += 1;
  return n;
}
