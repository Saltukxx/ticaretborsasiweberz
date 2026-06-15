import type { CurrentPriceRow, PriceBulletinPayload, PublicStat } from "./publicApi";
import {
  changeDirection,
  formatChangePct,
  formatPrice,
  hasChangePct,
} from "./priceDisplay";

export type CellTone = "green" | "gold" | "blue" | "red";

export type MosaicCell = {
  eyebrow: string;
  title: string;
  value: string;
  detail: string;
  change?: string;
  tone: CellTone;
  series?: number[];
  wide?: boolean;
  compass?: boolean;
  countUp?: number;
};

export type HeroMosaicInput = {
  prices: CurrentPriceRow[];
  bulletin: PriceBulletinPayload | null;
  stats: PublicStat[];
};

const HUBUBAT_RE = /hububat/i;
const BAKLIYAT_RE = /bakliyat/i;

function fmtNum(n: number, decimals = 2): string {
  return n.toLocaleString("tr-TR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function fmtTonsFromKg(kg: number): string {
  if (kg >= 1000) return `${fmtNum(kg / 1000, 1)} t`;
  return `${fmtNum(kg, 0)} kg`;
}

function changeChip(pct: number | null | undefined): { change?: string; tone: CellTone } {
  if (!hasChangePct(pct)) return { tone: "gold" };
  const dir = changeDirection(pct);
  const arrow = dir === "up" ? "▲" : "▼";
  return {
    change: `${arrow} ${formatChangePct(pct).replace(/^\+/, "")}`,
    tone: dir === "up" ? "green" : "red",
  };
}

function entryDateMs(row: CurrentPriceRow): number {
  if (!row.entry_date) return 0;
  const t = Date.parse(row.entry_date);
  return Number.isFinite(t) ? t : 0;
}

/** Prefer exact commodity slug (e.g. bugday-hts-satis), then bulletin rows, then freshest date. */
function findBySlugPart(
  rows: CurrentPriceRow[],
  part: string,
  bulletinRows: CurrentPriceRow[] = [],
): CurrentPriceRow | undefined {
  const p = part.toLowerCase();
  const exactSatis = `${p}-hts-satis`;
  const fromBulletin = bulletinRows.find((r) => r.product_slug === exactSatis);
  if (fromBulletin) return fromBulletin;

  const candidates = rows.filter(
    (r) =>
      r.product_slug === exactSatis ||
      (r.product_slug.startsWith(`${p}-`) && r.product_slug.endsWith("-satis")),
  );
  if (!candidates.length) {
    return rows.find((r) => r.product_slug.startsWith(`${p}-`));
  }
  return [...candidates].sort((a, b) => entryDateMs(b) - entryDateMs(a))[0];
}

function pickSecondaryProduct(
  prices: CurrentPriceRow[],
  bulletinRows: CurrentPriceRow[],
  parts: string[],
): CurrentPriceRow | undefined {
  const pool = bulletinRows.length > 0 ? bulletinRows : prices;
  const candidates: CurrentPriceRow[] = [];
  for (const part of parts) {
    const row = findBySlugPart(pool, part, bulletinRows);
    if (row) candidates.push(row);
  }
  if (!candidates.length) return undefined;
  return [...candidates].sort((a, b) => entryDateMs(b) - entryDateMs(a))[0];
}

function filterCategory(rows: CurrentPriceRow[], re: RegExp): CurrentPriceRow[] {
  return rows.filter((r) => re.test(r.product_category));
}

function avgOf(rows: CurrentPriceRow[]): number | null {
  const vals = rows.map((r) => r.avg_price).filter((v): v is number => v != null && v > 0);
  if (!vals.length) return null;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

function volumeKg(row: CurrentPriceRow): number {
  if (row.volume == null || row.volume <= 0) return 0;
  const unit = row.volume_unit?.toUpperCase();
  if (unit === "TON" || unit === "T") return row.volume * 1000;
  return row.volume;
}

function sumVolumeKg(rows: CurrentPriceRow[]): number {
  return rows.reduce((sum, r) => sum + volumeKg(r), 0);
}

function pickVolumeRows(
  bulletinRows: CurrentPriceRow[],
  prices: CurrentPriceRow[],
): CurrentPriceRow[] {
  return bulletinRows.length > 0 ? bulletinRows : prices;
}

function pickSparkline(rows: CurrentPriceRow[]): number[] | undefined {
  const best = rows
    .filter((r) => r.sparkline_series && r.sparkline_series.length > 1)
    .sort((a, b) => (b.sparkline_series?.length ?? 0) - (a.sparkline_series?.length ?? 0))[0];
  return best?.sparkline_series ?? undefined;
}

function productCell(row: CurrentPriceRow, eyebrow: string): MosaicCell {
  const ch = changeChip(row.change_pct);
  const high = row.high_price != null ? `En yüksek ${formatPrice(row.high_price)} ₺` : "";
  const low = row.low_price != null ? `En düşük ${formatPrice(row.low_price)} ₺` : "";
  return {
    eyebrow,
    title: "Ortalama",
    value: `${formatPrice(row.avg_price)} ₺`,
    detail: high || low || row.product_category,
    ...ch,
    tone: ch.tone,
    series: row.sparkline_series ?? undefined,
  };
}

function rangeCell(row: CurrentPriceRow, eyebrow: string): MosaicCell {
  const low = row.low_price;
  const high = row.high_price;
  const flat =
    low != null && high != null && Math.abs(high - low) < 0.05 * Math.max(high, 1);
  return {
    eyebrow,
    title: "Aralık",
    value:
      low != null && high != null
        ? `${formatPrice(low)}–${formatPrice(high)}`
        : "—",
    detail: "Günlük bant",
    change: flat ? "Yatay" : undefined,
    tone: flat ? "gold" : "blue",
  };
}

function statValue(stats: PublicStat[], match: RegExp): string | null {
  const row = stats.find((s) => match.test(s.label));
  if (!row) return null;
  return `${row.value}${row.suffix ?? ""}`;
}

function statCountUp(stats: PublicStat[], match: RegExp): number | undefined {
  const row = stats.find((s) => match.test(s.label));
  if (!row) return undefined;
  const n = Number(row.value.replace(/\./g, "").replace(",", "."));
  return Number.isFinite(n) ? Math.trunc(n) : undefined;
}

/** 8 mozaik sütunu — API verisiyle; boşsa güvenli “—” hücreleri. */
export function buildHeroMosaicCells(input: HeroMosaicInput): MosaicCell[][] {
  const { prices, bulletin, stats } = input;
  const bulletinRows = bulletin?.rows ?? [];
  const hububat = filterCategory(prices, HUBUBAT_RE);
  const hububatBulletin = bulletinRows.filter((r) => HUBUBAT_RE.test(r.product_category));

  const hububatAvg = avgOf(
    hububatBulletin.length ? hububatBulletin : hububat.length ? hububat : bulletinRows,
  );
  const allBulletinAvg = avgOf(bulletinRows);

  const bugday = findBySlugPart(prices, "bugday", bulletinRows);
  const secondary = pickSecondaryProduct(prices, bulletinRows, ["bulgur", "arpa", "pirinc"]);

  const volumePool = pickVolumeRows(bulletinRows, prices);
  const hububatVolumeRows = volumePool.filter(
    (r) => HUBUBAT_RE.test(r.product_category) || BAKLIYAT_RE.test(r.product_category),
  );
  const totalKg = sumVolumeKg(
    hububatVolumeRows.length ? hububatVolumeRows : volumePool,
  );

  const totalTxCount = volumePool.reduce(
    (sum, r) => sum + (r.transaction_count ?? 0),
    0,
  );

  const indexWide: MosaicCell = {
    eyebrow: "Endeks",
    title: "Hububat Endeksi",
    value: hububatAvg != null ? fmtNum(hububatAvg, 2) : "—",
    detail: bulletin?.sessionDate
      ? `Tescil bülteni · ${bulletin.sessionDate}`
      : "Güncel seans ortalaması",
    wide: true,
    series: pickSparkline(hububat),
    ...changeChip(
      (hububatBulletin.length ? hububatBulletin : hububat).find((r) =>
        hasChangePct(r.change_pct),
      )?.change_pct ?? null,
    ),
  };

  const tescilWide: MosaicCell = {
    eyebrow: "Endeks",
    title: "Tescilli Piyasa",
    value: allBulletinAvg != null ? fmtNum(allBulletinAvg, 2) : "—",
    detail:
      bulletinRows.length > 0
        ? `${bulletinRows.length} ürün · günlük bülten`
        : "Veri bekleniyor",
    wide: true,
    series: pickSparkline(bulletinRows),
    tone: "green",
  };

  const bugdayBulletin = bugday
    ? volumePool.find((r) => r.product_slug === bugday.product_slug)
    : undefined;
  const bugdayLabel = "Buğday";

  const bugdayCells: MosaicCell[] = bugday
    ? [
        productCell(bugday, bugdayLabel),
        {
          eyebrow: bugdayLabel,
          title: "Hacim",
          value:
            bugdayBulletin?.volume != null
              ? fmtTonsFromKg(volumeKg(bugdayBulletin))
              : "—",
          detail: bugdayBulletin?.transaction_amount
            ? `Tutar ${formatPrice(bugdayBulletin.transaction_amount)} ₺`
            : "Günlük işlem",
          ...changeChip(bugday.change_pct),
        },
      ]
    : [{ eyebrow: bugdayLabel, title: "Ortalama", value: "—", detail: "Bülten verisi yok", tone: "gold" }];

  const secondaryLabel =
    secondary?.product_name.split(" · ")[0]?.trim() ?? "Ürün";
  const secondaryCells: MosaicCell[] = secondary
    ? [productCell(secondary, secondaryLabel), rangeCell(secondary, secondaryLabel)]
    : [{ eyebrow: "Ürün", title: "Aralık", value: "—", detail: "Bülten verisi yok", tone: "gold" }];

  const volumeCells: MosaicCell[] = [
    {
      eyebrow: "Hacim",
      title: "Günlük İşlem",
      value: totalKg > 0 ? fmtTonsFromKg(totalKg) : "—",
      detail: "Hububat + bakliyat",
      tone: totalKg > 0 ? "green" : "gold",
    },
    {
      eyebrow: "Hacim",
      title: "Tescil Sayısı",
      value: totalTxCount > 0 ? fmtNum(totalTxCount, 0) : "—",
      detail: "İşlem adedi toplamı",
      change: totalTxCount > 0 ? "Canlı" : undefined,
      tone: "blue",
    },
  ];

  const memberVal = statValue(stats, /üye/i) ?? statValue(stats, /member/i);
  const memberCell: MosaicCell = {
    eyebrow: "Üye",
    title: "Aktif Üye",
    value: memberVal ?? "—",
    detail: "Üretici · tüccar · sanayici",
    tone: "gold",
    countUp: statCountUp(stats, /üye/i),
  };

  return [
    [indexWide, tescilWide],
    bugdayCells,
    secondaryCells,
    [{ eyebrow: "Yerel Saat", title: "Erzurum", value: "CANLI_SAAT", detail: "Piyasa akışı açık", tone: "blue" }],
    volumeCells,
    [memberCell],
    [{ eyebrow: "Konum", title: "Erzurum", value: "39°54′ N", detail: "Rakım 2.060 m", tone: "gold", compass: true }],
  ];
}
