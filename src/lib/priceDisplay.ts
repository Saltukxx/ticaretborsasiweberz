import type { CurrentPriceRow } from "./publicApi";

/** Fiyat yoksa “—”; asla 0 uydurma. */
export function formatPrice(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return value.toLocaleString("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function hasChangePct(
  value: number | null | undefined,
): value is number {
  return value != null && Number.isFinite(value);
}

export function formatChangePct(value: number | null | undefined): string {
  if (!hasChangePct(value)) return "—";
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toLocaleString("tr-TR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 2,
  })}%`;
}

export function changeDirection(
  value: number | null | undefined,
): "up" | "down" | "neutral" {
  if (!hasChangePct(value)) return "neutral";
  return value >= 0 ? "up" : "down";
}

export function formatVolume(p: Pick<CurrentPriceRow, "volume" | "volume_unit">): string {
  if (p.volume == null || !Number.isFinite(p.volume)) return "—";
  const unit = p.volume_unit ? ` ${p.volume_unit}` : "";
  return `${p.volume.toLocaleString("tr-TR")}${unit}`;
}

export function formatMoney(value: number | null | undefined, suffix = " ₺"): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return `${formatPrice(value)}${suffix}`;
}

export function formatInteger(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return value.toLocaleString("tr-TR");
}

export function saleTypeFromProductName(name: string): string | null {
  const parts = name.split(" · ").map((s) => s.trim());
  if (parts.length >= 2 && parts[1] !== "Alış" && parts[1] !== "Satış") {
    return parts[1];
  }
  return null;
}

/** Erzurum bülteni + TOBB satış/işlem türü kısaltmaları */
export const SALE_TYPE_LABELS: Record<string, string> = {
  HTS: "Hazır Tüccar Satış",
  HMS: "Hazır Müstahsil Satış",
  HTSG: "Hazır Tüccar Satış Geç.",
  HMSG: "Hazır Müstahsil Satış Geç.",
  HMSGT: "Hazır Müstahsil Satış Geç.",
  EBKS: "Et Balık Kurumu Satış",
  EBKA: "Et Balık Kurumu Alış",
  İHR: "İhracat",
  IHR: "İhracat",
  İTH: "İthalat",
  ITH: "İthalat",
  OfisS: "Toprak Mahsülleri Ofisi Satış",
  OfisA: "Toprak Mahsülleri Ofisi Alış",
  FABA: "Fabrika Alım",
  FABS: "Fabrika Satım",
  KOOPA: "Kooperatif Alım",
  KOOPS: "Kooperatif Satım",
  TARA: "Tariş Alım",
  TARS: "Tariş Satım",
  TMOA: "Toprak Mahsülleri Ofisi Alım",
  TMOS: "Toprak Mahsülleri Ofisi Satım",
  VMS: "Vadeli Müstahsil Satış",
  VTS: "Vadeli Tüccar Satış",
};

export function formatSaleTypeLabel(code: string): string {
  const trimmed = code.trim();
  if (!trimmed) return code;
  return SALE_TYPE_LABELS[trimmed] ?? SALE_TYPE_LABELS[trimmed.toUpperCase()] ?? trimmed;
}

const SIDE_LABELS: Record<string, string> = {
  Satis: "Satış",
  Satış: "Satış",
  Alis: "Alış",
  Alış: "Alış",
};

/** Bülten satır başlığı: `AYÇIÇEK YAĞI · HTS · Satış` → kısaltmasız tam etiketler. */
export function formatBulletinProductName(name: string): string {
  const parts = name.split(" · ").map((s) => s.trim()).filter(Boolean);
  if (parts.length < 2) return name;

  const [product, segment2, segment3, ...rest] = parts;
  const sideFromThird =
    segment3 != null && (segment3 in SIDE_LABELS || segment3 === "Satış" || segment3 === "Alış");

  if (sideFromThird) {
    return [
      product,
      formatSaleTypeLabel(segment2),
      SIDE_LABELS[segment3] ?? segment3,
      ...rest,
    ].join(" · ");
  }

  if (segment2 !== "Alış" && segment2 !== "Satış" && !(segment2 in SIDE_LABELS)) {
    return [product, formatSaleTypeLabel(segment2), segment3, ...rest].filter(Boolean).join(" · ");
  }

  return name;
}
