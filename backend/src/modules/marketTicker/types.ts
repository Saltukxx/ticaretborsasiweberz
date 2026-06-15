export type MarketTickerItem = {
  code: string;
  label: string;
  value: number;
  changePct: number | null;
  direction: number | null;
  unit: "try" | "index" | "fx";
};

export type MarketTickerPayload = {
  items: MarketTickerItem[];
  source: "live" | "fallback";
  updatedAt: string | null;
};

export type TruncgilRate = {
  Buying?: number | string;
  Selling?: number | string;
  Change?: number | string;
  Type?: string;
  Name?: string;
};

export type TruncgilFinanceResponse = {
  Meta_Data?: {
    Update_Date?: string;
    Current_Date?: string;
  };
  Rates?: Record<string, TruncgilRate>;
};
