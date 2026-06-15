import * as cheerio from "cheerio";
import {
  parseChartCategory,
  parseTurkishDecimal,
  slugifyPart,
} from "../normalize.js";
import type { MonthlyHistoryPoint, PriceSide } from "../types.js";

export type ProductOption = {
  name: string;
  category: string;
};

export function parseProductCatalog(html: string): ProductOption[] {
  const $ = cheerio.load(html);
  const out: ProductOption[] = [];
  let category = "GENEL";

  $("#MNAME optgroup").each((_, og) => {
    const label = $(og).attr("label")?.trim();
    if (label) category = label;
    $(og)
      .find("option")
      .each((__, opt) => {
        const val = $(opt).attr("value")?.trim();
        if (val) out.push({ name: val, category });
      });
  });

  if (out.length === 0) {
    $("#MNAME option").each((_, opt) => {
      const val = $(opt).attr("value")?.trim();
      if (val) out.push({ name: val, category });
    });
  }

  return out;
}

type SeriesBlock = {
  name: string;
  data: number[];
};

function extractCategories(script: string): string[] {
  const m = script.match(/categories:\s*\[([\s\S]*?)\]/);
  if (!m) return [];
  const inner = m[1]!;
  const items: string[] = [];
  const re = /'([^']+)'/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(inner)) !== null) {
    items.push(match[1]!);
  }
  return items;
}

function extractSeries(script: string): SeriesBlock[] {
  const blocks: SeriesBlock[] = [];
  const re =
    /\{\s*name:\s*'([^']*)'\s*,\s*data:\s*\[([\d.,\s]+)\]\s*\}/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(script)) !== null) {
    const data = m[2]!
      .split(",")
      .map((s) => Number(s.trim()))
      .filter((n) => Number.isFinite(n));
    blocks.push({ name: m[1]!, data });
  }
  return blocks;
}

function classifySeries(name: string): "low" | "high" | "avg" | null {
  const n = transliterateTr(name).toLowerCase();
  if (n.includes("dusuk")) return "low";
  if (n.includes("yuksek")) return "high";
  if (n.includes("ortalama")) return "avg";
  return null;
}

function transliterateTr(input: string): string {
  const TR_MAP: Record<string, string> = {
    ç: "c", Ç: "c", ğ: "g", Ğ: "g", ı: "i", İ: "i", ö: "o", Ö: "o",
    ş: "s", Ş: "s", ü: "u", Ü: "u",
  };
  let out = "";
  for (const ch of input) out += TR_MAP[ch] ?? ch;
  return out;
}

export function parseProductChartHtml(
  html: string,
  productName: string,
  category: string,
  saleType: string,
  transactionType: "mustahsil" | "tuccar",
): MonthlyHistoryPoint[] {
  const scriptMatch = html.match(
    /\$\('#line_chartm'\)\.highcharts\(\{[\s\S]*?\}\);/,
  );
  if (!scriptMatch) return [];

  const script = scriptMatch[0]!;
  const categories = extractCategories(script);
  const series = extractSeries(script);
  if (!categories.length || !series.length) return [];

  const baseSlug = `${slugifyPart(productName)}-${slugifyPart(saleType)}`;
  const byMonth = new Map<string, MonthlyHistoryPoint>();

  for (const s of series) {
    const kind = classifySeries(s.name);
    if (!kind) continue;
    const len = Math.min(categories.length, s.data.length);
    for (let i = 0; i < len; i++) {
      const ym = parseChartCategory(categories[i]!);
      const val = s.data[i];
      if (!ym || val == null || val <= 0) continue;
      const dec = parseTurkishDecimal(
        String(val).includes(",") ? String(val) : String(val).replace(".", ","),
      );
      if (!dec) continue;

      let row = byMonth.get(ym);
      if (!row) {
        row = {
          productSlug: baseSlug,
          productName,
          category,
          yearMonth: ym,
          side: "alis" as PriceSide,
          saleType,
          avgPrice: null,
          lowPrice: null,
          highPrice: null,
          transactionType,
        };
        byMonth.set(ym, row);
      }
      if (kind === "low") row.lowPrice = dec;
      if (kind === "high") row.highPrice = dec;
      if (kind === "avg") row.avgPrice = dec;
    }
  }

  return [...byMonth.values()].filter(
    (p) => p.lowPrice || p.highPrice || p.avgPrice,
  );
}

export type VolumeSeriesPoint = {
  year: string;
  chartTitle: string;
  seriesName: string;
  categories: string[];
  values: number[];
};

export function parseVolumePageHtml(html: string, year: string): VolumeSeriesPoint[] {
  const results: VolumeSeriesPoint[] = [];
  const chartBlocks = html.split(/highcharts\s*\(\s*\{/);
  for (let i = 1; i < chartBlocks.length; i++) {
    const block = chartBlocks[i]!;
    const titleM = block.match(/text:\s*'([^']*)'/);
    const cats = extractCategories(block);
    const series = extractSeries(block);
    for (const s of series) {
      results.push({
        year,
        chartTitle: titleM?.[1] ?? `chart-${i}`,
        seriesName: s.name,
        categories: cats,
        values: s.data,
      });
    }
  }
  return results;
}
