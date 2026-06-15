export type StaticSeoEntry = {
  title: string;
  description: string;
};

/** Exact path → SEO metadata for static public routes. */
export const STATIC_SEO: Record<string, StaticSeoEntry> = {
  "/": {
    title: "Erzurum Ticaret Borsası",
    description:
      "Erzurum Ticaret Borsası resmi web sitesi. Güncel fiyat bültenleri, piyasa verileri, hububat ve tarım ürünleri fiyatları, haberler ve kurumsal hizmetler.",
  },
  "/kurumsal": {
    title: "Kurumsal",
    description:
      "Erzurum Ticaret Borsası kurumsal bilgiler, misyon, vizyon, tarihçe ve yönetim. 1946'dan beri Doğu Anadolu'nun ticaret altyapısı.",
  },
  "/cografi-isaretler": {
    title: "Coğrafi İşaretler",
    description:
      "Erzurum coğrafi işaretleri ve bölgesel ürünler. Erzurum Ticaret Borsası coğrafi işaret atlası.",
  },
  "/cografi-isaretler/kadayif-dolmasi": {
    title: "Kadayıf Dolması Coğrafi İşareti",
    description:
      "Erzurum Kadayıf Dolması coğrafi işareti — tarif, kültür ve interaktif deneyim.",
  },
  "/piyasa-verileri": {
    title: "Piyasa Verileri",
    description:
      "Erzurum Ticaret Borsası piyasa verileri, işlem hacimleri, endeksler ve grafikler.",
  },
  "/fiyat-bulteni": {
    title: "Güncel Fiyat Bülteni",
    description:
      "Erzurum borsa fiyatları ve günlük fiyat bülteni. Hububat, bakliyat ve tarım ürünleri tescilli piyasa fiyatları.",
  },
  "/haberler": {
    title: "Haberler",
    description:
      "Erzurum Ticaret Borsası haberleri, kurumsal gündem ve saha gelişmeleri.",
  },
  "/duyurular": {
    title: "Duyurular",
    description:
      "Erzurum Ticaret Borsası resmi duyuruları ve üye bilgilendirmeleri.",
  },
  "/raporlar": {
    title: "Raporlar",
    description:
      "Erzurum Ticaret Borsası dönemsel raporları ve yayınlanan analiz dokümanları.",
  },
  "/projeler": {
    title: "Projeler",
    description:
      "Erzurum Ticaret Borsası kalkınma ve bölgesel projeleri.",
  },
  "/etkinlikler": {
    title: "Etkinlikler",
    description:
      "Erzurum Ticaret Borsası etkinlik takvimi, toplantılar ve eğitimler.",
  },
  "/hizmetler": {
    title: "Hizmetler",
    description:
      "Erzurum Ticaret Borsası üye hizmetleri, tescil, laboratuvar ve kurumsal işlemler.",
  },
  "/iletisim": {
    title: "İletişim",
    description:
      "Erzurum Ticaret Borsası iletişim — Yakutiye/Erzurum adres, telefon ve e-posta.",
  },
  "/kurumsal/yonetim": {
    title: "Yönetim",
    description:
      "Erzurum Ticaret Borsası yönetim kurulu ve başkanlık.",
  },
  "/kvkk": {
    title: "KVKK ve Kişisel Veriler",
    description:
      "Erzurum Ticaret Borsası KVKK aydınlatma metinleri, gizlilik ve çerez politikaları.",
  },
};

const DETAIL_PREFIXES = [
  "/haberler/",
  "/duyurular/",
  "/raporlar/",
  "/kurumsal/belgeler/",
  "/etkinlikler/",
  "/cografi-isaretler/",
  "/yasal/",
  "/kvkk/",
] as const;

export function isDetailPath(pathname: string): boolean {
  return DETAIL_PREFIXES.some(
    (prefix) => pathname.startsWith(prefix) && pathname.length > prefix.length,
  );
}

export function lookupStaticSeo(pathname: string): StaticSeoEntry | undefined {
  return STATIC_SEO[pathname];
}
