import type { PriceSide } from "./types.js";

const TR_MAP: Record<string, string> = {
  ç: "c",
  Ç: "c",
  ğ: "g",
  Ğ: "g",
  ı: "i",
  İ: "i",
  I: "i",
  ö: "o",
  Ö: "o",
  ş: "s",
  Ş: "s",
  ü: "u",
  Ü: "u",
};

export function transliterateTr(input: string): string {
  let out = "";
  for (const ch of input) {
    out += TR_MAP[ch] ?? ch;
  }
  return out;
}

export function slugifyPart(input: string): string {
  const base = transliterateTr(input)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return base || "urun";
}

export function buildProductSlug(
  productName: string,
  saleType: string,
  side?: PriceSide,
): string {
  const parts = [slugifyPart(productName), slugifyPart(saleType)];
  if (side) parts.push(side);
  const slug = parts.join("-").slice(0, 100);
  return slug;
}

export function displayProductName(
  productName: string,
  saleType: string,
  side?: PriceSide,
): string {
  const sideLabel =
    side === "alis" ? "Alış" : side === "satis" ? "Satış" : undefined;
  return [productName, saleType, sideLabel].filter(Boolean).join(" · ");
}

/** Parse `9,30` or `3.320,00` → decimal string for DB */
export function parseTurkishDecimal(raw: string): string | null {
  const t = raw.trim().replace(/\s/g, "");
  if (!t || t === "0,00" || t === "0.00" || t === "0") return null;
  const normalized = t.replace(/\./g, "").replace(",", ".");
  const n = Number(normalized);
  if (!Number.isFinite(n)) return null;
  return n.toFixed(4).replace(/\.?0+$/, "").replace(/(\.\d*?)0+$/, "$1");
}

/** `08.05.2026` → `2026-05-08` */
export function parseDatabankDate(raw: string): string | null {
  const m = raw.trim().match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (!m) return null;
  return `${m[3]}-${m[2]}-${m[1]}`;
}

/** `45` or `1.234` → işlem adedi */
export function parseTurkishInteger(raw: string): number | null {
  const t = raw.trim().replace(/\s/g, "").replace(/\./g, "");
  if (!t || t === "0") return null;
  const n = Number(t);
  if (!Number.isFinite(n) || !Number.isInteger(n)) return null;
  return n;
}

/** `3.320,00 KG` → volume + unit */
export function parseVolumeCell(raw: string): {
  volume: string | null;
  volumeUnit: string | null;
} {
  const t = raw.trim().replace(/\u00a0/g, " ");
  if (!t || t === "0,00" || t === "-") {
    return { volume: null, volumeUnit: null };
  }
  const m = t.match(/^([\d.,]+)\s*(.*)$/);
  if (!m) return { volume: null, volumeUnit: null };
  const vol = parseTurkishDecimal(m[1]!);
  const unit = m[2]?.trim() || null;
  return { volume: vol, volumeUnit: unit };
}

/** `2026.Mayıs` → `2026-05` */
export function parseChartCategory(cat: string): string | null {
  const t = cat.trim().replace(/['"]/g, "");
  const m = t.match(/^(\d{4})\.(\S+)/);
  if (!m) return null;
  const monthMap: Record<string, string> = {
    ocak: "01",
    şubat: "02",
    subat: "02",
    mart: "03",
    nisan: "04",
    mayıs: "05",
    mayis: "05",
    haziran: "06",
    temmuz: "07",
    ağustos: "08",
    agustos: "08",
    eylül: "09",
    eylul: "09",
    ekim: "10",
    kasım: "11",
    kasim: "11",
    aralık: "12",
    aralik: "12",
  };
  const key = transliterateTr(m[2]!.toLowerCase());
  const mm = monthMap[key];
  if (!mm) return null;
  return `${m[1]}-${mm}`;
}

const ISTANBUL_TZ = "Europe/Istanbul";

export function isoDateToday(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: ISTANBUL_TZ }).format(
    new Date(),
  );
}

export const TURKISH_MONTH_NAMES = [
  "Ocak",
  "Şubat",
  "Mart",
  "Nisan",
  "Mayıs",
  "Haziran",
  "Temmuz",
  "Ağustos",
  "Eylül",
  "Ekim",
  "Kasım",
  "Aralık",
] as const;

/** DataBank MON alanı: `2026.Mayıs` */
export function databankMonthKey(year: number, month1: number): string {
  const name = TURKISH_MONTH_NAMES[month1 - 1];
  if (!name) throw new Error(`Invalid month: ${month1}`);
  return `${year}.${name}`;
}

/** Ayın son günü ISO tarihi (month1: 1=Ocak). */
export function lastDayOfMonthIso(year: number, month1: number): string {
  const d = new Date(Date.UTC(year, month1, 0));
  return d.toISOString().slice(0, 10);
}

/** Devam eden ay için bugün, geçmiş aylar için ay sonu. */
export function monthEndOrTodayIso(year: number, month1: number): string {
  const last = lastDayOfMonthIso(year, month1);
  const today = isoDateToday();
  return last > today ? today : last;
}

/** Yıllık bülten satırı için entry_date (devam eden yıl = bugün). */
export function entryDateForYearlyBulletin(year: number): string {
  const currentYear = new Date().getFullYear();
  if (year < currentYear) return `${year}-12-31`;
  return isoDateToday();
}

export function addDays(iso: string, delta: number): string {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().slice(0, 10);
}
