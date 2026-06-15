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
