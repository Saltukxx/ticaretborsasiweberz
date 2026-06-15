export type PriceSide = "alis" | "satis";

export type HomeTableRow = {
  productName: string;
  saleType: string;
  lastTradeDate: string;
  category: string;
  buy: { low: string | null; high: string | null; avg: string | null };
  sell: { low: string | null; high: string | null; avg: string | null };
};

export type TescilBulletinRow = {
  productName: string;
  saleType: string;
  low: string;
  high: string;
  avg: string;
  volume: string | null;
  volumeUnit: string | null;
  transactionAmount: string | null;
  transactionCount: number | null;
  category: string;
};

export type MappedPriceEntry = {
  productSlug: string;
  productName: string;
  category: string;
  unit: string;
  entryDate: string;
  avgPrice: string;
  lowPrice: string;
  highPrice: string;
  changePct?: string | null;
  volume?: string | null;
  volumeUnit?: string | null;
  transactionAmount?: string | null;
  transactionCount?: number | null;
};

export type MonthlyHistoryPoint = {
  productSlug: string;
  productName: string;
  category: string;
  yearMonth: string;
  side: PriceSide;
  saleType: string;
  avgPrice: string | null;
  lowPrice: string | null;
  highPrice: string | null;
  transactionType: "mustahsil" | "tuccar";
};

export type SyncSection = "home" | "tescil" | "charts" | "volume";

export type SyncRunStatus = "running" | "success" | "failed";
