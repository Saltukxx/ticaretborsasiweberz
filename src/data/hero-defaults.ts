/** Fallback when hero API is unavailable — matches seeded backend defaults. */
export type HeroKpi = {
  label: string;
  value: string;
  valueSuffix?: string;
  highlighted?: boolean;
};

export type HeroContent = {
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
  kpis: HeroKpi[];
};

export const DEFAULT_HERO_CONTENT: HeroContent = {
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
  kpis: [
    { label: "Kurucu Yıl", value: "1946" },
    { label: "Aktif Üye", value: "1.842" },
    { label: "Günlük Hacim", value: "284", valueSuffix: ",5 t" },
    { label: "Endeks", value: "▲ 1.284,5", highlighted: true },
  ],
};
