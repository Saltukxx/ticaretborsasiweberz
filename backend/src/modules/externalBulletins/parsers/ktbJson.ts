import { parseTurkishInteger } from "../../databankSync/normalize.js";
import type { ExternalBulletinRow } from "../types.js";
import { parseTurkishMoneyField } from "../parseNumbers.js";

export type KtbAnlikRow = {
  GrupAdi?: string;
  SinifAdi?: string;
  MinFiyat?: string | number;
  OrtFiyat?: string | number;
  MaxFiyat?: string | number;
  Miktar?: string | number;
  IslemSayisi?: number | string;
};

export function parseKtbAnlikBulletinJson(raw: unknown): ExternalBulletinRow[] {
  if (!Array.isArray(raw)) return [];

  const rows: ExternalBulletinRow[] = [];
  for (const item of raw as KtbAnlikRow[]) {
    const productName = item.SinifAdi?.trim();
    const category = item.GrupAdi?.trim() ?? "GENEL";
    const low = parseTurkishMoneyField(item.MinFiyat);
    const high = parseTurkishMoneyField(item.MaxFiyat);
    const avg = parseTurkishMoneyField(item.OrtFiyat);
    if (!productName || low == null || high == null || avg == null) continue;

    const volume = parseTurkishMoneyField(item.Miktar);
    const transactionCount =
      typeof item.IslemSayisi === "number"
        ? item.IslemSayisi
        : parseTurkishInteger(String(item.IslemSayisi ?? ""));

    rows.push({
      productName,
      category,
      saleType: null,
      lowPrice: low,
      highPrice: high,
      avgPrice: avg,
      volume,
      volumeUnit: volume != null ? "KG" : null,
      transactionAmount: null,
      transactionCount,
    });
  }

  return rows;
}
