import { transliterateTr } from "../databankSync/normalize.js";
import type { CurrentPriceRow } from "../prices/prices.public.service.js";

function formatPriceTr(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return value.toLocaleString("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatVolume(row: Pick<CurrentPriceRow, "volume" | "volume_unit">): string {
  if (row.volume == null || !Number.isFinite(row.volume)) return "—";
  const unit = row.volume_unit ? ` ${row.volume_unit}` : "";
  return `${row.volume.toLocaleString("tr-TR")}${unit}`;
}

function normalizeForMatch(input: string): string {
  return transliterateTr(input)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function scoreProductMatch(query: string, row: CurrentPriceRow): number {
  const q = normalizeForMatch(query);
  if (!q) return 0;

  const name = normalizeForMatch(row.product_name);
  const slug = normalizeForMatch(row.product_slug.replace(/-/g, " "));
  const tokens = q.split(" ").filter((t) => t.length > 1);
  if (tokens.length === 0) return 0;

  let score = 0;
  for (const token of tokens) {
    if (name.includes(token) || slug.includes(token)) score += 2;
  }
  if (name.includes(q) || slug.includes(q.replace(/\s+/g, ""))) score += 5;
  return score;
}

function isListAllQuery(message: string): boolean {
  return /\b(neler\s*var|hangi\s*ürün|hangi\s*urun|tüm\s*ürün|tum\s*urun|bültende|bultende|liste)\b/i.test(
    message,
  );
}

function formatRowDetail(row: CurrentPriceRow, sessionDate: string | null): string {
  const unit = row.product_unit?.replace("₺/", "") ?? "kg";
  return [
    `**${row.product_name}**`,
    `- Ortalama: **${formatPriceTr(row.avg_price)}** ₺/${unit}`,
    `- En az: ${formatPriceTr(row.low_price)} ₺ | En çok: ${formatPriceTr(row.high_price)} ₺`,
    `- İşlem miktarı: ${formatVolume(row)}`,
    sessionDate ? `- Seans: ${sessionDate}` : null,
  ]
    .filter(Boolean)
    .join("\n");
}

export function buildPriceReply(
  message: string,
  sessionDate: string | null,
  rows: CurrentPriceRow[],
): string {
  if (rows.length === 0) {
    return [
      "Bugün için yayımlanmış günlük tescil bülteni kaydı bulunmuyor.",
      "Güncel listeyi [Fiyat Bülteni](/fiyat-bulteni) sayfasından takip edebilirsiniz.",
    ].join("\n\n");
  }

  if (isListAllQuery(message) || /^bülten|^bulten/i.test(message.trim())) {
    const lines = rows.map(
      (r) =>
        `- **${r.product_name}** — ort. **${formatPriceTr(r.avg_price)}** ₺`,
    );
    return [
      sessionDate
        ? `**${sessionDate}** tescil bülteni (${rows.length} ürün):`
        : `Günlük tescil bülteni (${rows.length} ürün):`,
      ...lines,
      "",
      "Detaylı tablo: [Fiyat Bülteni](/fiyat-bulteni)",
    ].join("\n");
  }

  const scored = rows
    .map((row) => ({ row, score: scoreProductMatch(message, row) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);

  if (scored.length === 0) {
    return [
      "Bugünkü tescil bülteninde sorunuzla eşleşen bir ürün bulamadım.",
      "Ürün adını net yazabilir veya [Fiyat Bülteni](/fiyat-bulteni) sayfasındaki tam listeye bakabilirsiniz.",
    ].join("\n\n");
  }

  if (scored.length === 1) {
    return [
      formatRowDetail(scored[0]!.row, sessionDate),
      "",
      "[Fiyat Bülteni](/fiyat-bulteni) sayfasında tüm ürünleri görebilirsiniz.",
    ].join("\n");
  }

  const top = scored.slice(0, 5);
  const lines = top.map(
    ({ row }) =>
      `- **${row.product_name}** — ort. **${formatPriceTr(row.avg_price)}** ₺`,
  );
  return [
    "Birkaç eşleşme buldum; hangisini kastettiğinizi belirtirseniz detay verebilirim:",
    ...lines,
    "",
    "[Fiyat Bülteni](/fiyat-bulteni)",
  ].join("\n");
}
