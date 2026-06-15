export type ExternalBulletinRow = {
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
};

export type ExternalBulletinSourceMeta = {
  id: string;
  name: string;
  shortName: string;
  sourceUrl: string;
};

export type ExternalBulletinSourceResult = ExternalBulletinSourceMeta & {
  sessionDate: string | null;
  fetchedAt: string;
  status: "ok" | "error";
  errorMessage?: string;
  rows: ExternalBulletinRow[];
};

export type ExternalBulletinsPayload = {
  fetchedAt: string;
  sessionDate: string;
  sources: ExternalBulletinSourceResult[];
};
