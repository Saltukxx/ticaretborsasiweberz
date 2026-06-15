import type { Database } from "../../db/connection.js";
import { sanitizeOptionalRichHtml } from "../../lib/sanitizeHtml.js";
import { heroContent, type HeroKpiRow } from "../../db/schema/hero.js";

function stripUndefined<T extends Record<string, unknown>>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined),
  ) as Partial<T>;
}

export const DEFAULT_HERO_KPIS: HeroKpiRow[] = [
  { label: "Kurucu Yıl", value: "1946" },
  { label: "Aktif Üye", value: "1.842" },
  { label: "Günlük Hacim", value: "284", valueSuffix: ",5 t" },
  { label: "Endeks", value: "▲ 1.284,5", highlighted: true },
];

export const DEFAULT_HERO_CONTENT = {
  eyebrow: "ETB · 1946'dan beri · Doğu Anadolu",
  titleLead: "Doğu Anadolu'nun",
  titleEmphasis: "Ticaret",
  titleSuffix: "Nabzı",
  titleTagline: "↘ tarım · veri · piyasa · şeffaflık",
  description:
    "Erzurum Ticaret Borsası; üretici, tüccar ve sanayiciyi güvenilir piyasa verileri, kurumsal hizmetler ve şeffaf ticaret altyapısıyla buluşturur. Bölgenin hububat, bakliyat ve canlı hayvan ekonomisine modern dijital omurga sağlıyoruz.",
  ctaPrimaryLabel: "Güncel Fiyatları İncele",
  ctaPrimaryHref: "/fiyat-bulteni",
  ctaSecondaryLabel: "Fiyat Bültenine Git",
  ctaSecondaryHref: "/fiyat-bulteni",
  ctaLinkLabel: "Kurumsal Bilgi Al",
  ctaLinkHref: "/kurumsal",
  kpis: DEFAULT_HERO_KPIS,
};

export type PatchHeroContentInput = Partial<{
  eyebrow: string;
  titleLead: string;
  titleEmphasis: string;
  titleSuffix: string;
  titleTagline: string;
  description: string;
  ctaPrimaryLabel: string;
  ctaPrimaryHref: string;
  ctaSecondaryLabel: string;
  ctaSecondaryHref: string;
  ctaLinkLabel: string;
  ctaLinkHref: string;
  kpis: HeroKpiRow[];
}>;

function mapHeroRow(row: typeof heroContent.$inferSelect) {
  return {
    id: row.id,
    eyebrow: row.eyebrow,
    titleLead: row.titleLead,
    titleEmphasis: row.titleEmphasis,
    titleSuffix: row.titleSuffix,
    titleTagline: row.titleTagline,
    description: row.description,
    ctaPrimaryLabel: row.ctaPrimaryLabel,
    ctaPrimaryHref: row.ctaPrimaryHref,
    ctaSecondaryLabel: row.ctaSecondaryLabel,
    ctaSecondaryHref: row.ctaSecondaryHref,
    ctaLinkLabel: row.ctaLinkLabel,
    ctaLinkHref: row.ctaLinkHref,
    kpis: (row.kpis ?? DEFAULT_HERO_KPIS) as HeroKpiRow[],
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function ensureHeroContent(db: Database) {
  const [existing] = await db.select().from(heroContent).limit(1);
  if (existing) return existing;

  const [row] = await db.insert(heroContent).values(DEFAULT_HERO_CONTENT).returning();
  if (!row) throw new Error("insert hero content failed");
  return row;
}

export async function getHeroContentAdmin(db: Database) {
  const row = await ensureHeroContent(db);
  return mapHeroRow(row);
}

export async function getHeroContentPublic(db: Database) {
  return getHeroContentAdmin(db);
}

export async function patchHeroContent(db: Database, patch: PatchHeroContentInput) {
  await ensureHeroContent(db);
  const updates = stripUndefined(patch) as PatchHeroContentInput;
  if (updates.description !== undefined) {
    updates.description = sanitizeOptionalRichHtml(updates.description) ?? "";
  }
  const [row] = await db
    .update(heroContent)
    .set({ ...updates, updatedAt: new Date() })
    .returning();
  if (!row) throw new Error("patch hero content failed");
  return mapHeroRow(row);
}
