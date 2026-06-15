import { parseTurkishDecimal } from "../databankSync/normalize.js";

export function parseTurkishMoney(raw: string | null | undefined): number | null {
  if (!raw) return null;
  const dec = parseTurkishDecimal(raw);
  if (!dec) return null;
  const n = Number(dec);
  return Number.isFinite(n) ? n : null;
}

export function parseTurkishMoneyField(
  raw: string | number | null | undefined,
): number | null {
  if (raw == null) return null;
  return parseTurkishMoney(String(raw));
}
