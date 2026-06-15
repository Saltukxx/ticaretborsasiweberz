/**
 * Erzurum ilçe merkezleri — WGS84 (lng, lat).
 * MAP_BBOX, erzurum-map.png poster görünümüne göre kalibre edilmiştir.
 * Uzak ilçeler görsel okunabilirlik için merkeze doğru hafifçe çekilmiştir.
 * Yakutiye, Aziziye, Palandöken haritada gösterilmez (Erzurum Merkez tek tescil noktası).
 */
export const MAP_BBOX = {
  lonMin: 40.4,
  lonMax: 42.42,
  latMin: 39.25,
  latMax: 41.0,
} as const;

export const CENTER_DISTRICT_SLUG = "merkez" as const;

export const DISTRICT_POSITIONS: Record<string, { lon: number; lat: number }> = {
  merkez: { lon: 41.2769, lat: 39.9043 },
  askale: { lon: 40.762892, lat: 39.919348 },
  cat: { lon: 41.009564, lat: 39.627376 },
  hinis: { lon: 41.62626, lat: 39.455244 },
  horasan: { lon: 41.958012, lat: 40.00804 },
  ispir: { lon: 41.045496, lat: 40.371618 },
  karacoban: { lon: 41.911534, lat: 39.483665 },
  karayazi: { lon: 41.935736, lat: 39.749838 },
  koprukoy: { lon: 41.799806, lat: 39.967005 },
  narman: { lon: 41.738828, lat: 40.236724 },
  oltu: { lon: 41.814828, lat: 40.390396 },
  olur: { lon: 41.927789, lat: 40.610365 },
  pasinler: { lon: 41.654216, lat: 39.974424 },
  pazaryolu: { lon: 40.890766, lat: 40.293123 },
  senkaya: { lon: 42.092456, lat: 40.407699 },
  tekman: { lon: 41.494447, lat: 39.660558 },
  tortum: { lon: 41.509791, lat: 40.248116 },
  uzundere: { lon: 41.483189, lat: 40.384688 },
};

export const DISTRICT_SLUG_ORDER = [
  "merkez",
  "askale",
  "cat",
  "hinis",
  "horasan",
  "ispir",
  "karacoban",
  "karayazi",
  "koprukoy",
  "narman",
  "oltu",
  "olur",
  "pasinler",
  "pazaryolu",
  "senkaya",
  "tekman",
  "tortum",
  "uzundere",
] as const;

export type DistrictSlug = (typeof DISTRICT_SLUG_ORDER)[number];

type DistrictFallback = {
  label: string;
  productLine: string;
  dailyVolume: string;
  memberCount: number;
  registrationCount: number;
};

export const DISTRICT_FALLBACK: Record<DistrictSlug, DistrictFallback> = {
  merkez: {
    label: "Erzurum Merkez",
    productLine: "Hububat · Tescil Merkezi",
    dailyVolume: "—",
    memberCount: 0,
    registrationCount: 0,
  },
  askale: {
    label: "Aşkale",
    productLine: "Hububat · Yemlik",
    dailyVolume: "—",
    memberCount: 0,
    registrationCount: 0,
  },
  cat: {
    label: "Çat",
    productLine: "Yemlik · Arpa",
    dailyVolume: "—",
    memberCount: 0,
    registrationCount: 0,
  },
  hinis: {
    label: "Hınıs",
    productLine: "Hububat · Bakliyat",
    dailyVolume: "—",
    memberCount: 0,
    registrationCount: 0,
  },
  horasan: {
    label: "Horasan",
    productLine: "Hububat · Bakliyat",
    dailyVolume: "—",
    memberCount: 0,
    registrationCount: 0,
  },
  ispir: {
    label: "İspir",
    productLine: "Süt · Tarımsal üretim",
    dailyVolume: "—",
    memberCount: 0,
    registrationCount: 0,
  },
  karacoban: {
    label: "Karaçoban",
    productLine: "Hububat · Hayvancılık",
    dailyVolume: "—",
    memberCount: 0,
    registrationCount: 0,
  },
  karayazi: {
    label: "Karayazı",
    productLine: "Hububat · Mera hayvancılığı",
    dailyVolume: "—",
    memberCount: 0,
    registrationCount: 0,
  },
  koprukoy: {
    label: "Köprüköy",
    productLine: "Hububat · Tarımsal ticaret",
    dailyVolume: "—",
    memberCount: 0,
    registrationCount: 0,
  },
  narman: {
    label: "Narman",
    productLine: "Hububat",
    dailyVolume: "—",
    memberCount: 0,
    registrationCount: 0,
  },
  oltu: {
    label: "Oltu",
    productLine: "Tarımsal karışık · Orman ürünleri",
    dailyVolume: "—",
    memberCount: 0,
    registrationCount: 0,
  },
  olur: {
    label: "Olur",
    productLine: "Hayvancılık · Hububat",
    dailyVolume: "—",
    memberCount: 0,
    registrationCount: 0,
  },
  pasinler: {
    label: "Pasinler",
    productLine: "Buğday · Arpa",
    dailyVolume: "—",
    memberCount: 0,
    registrationCount: 0,
  },
  pazaryolu: {
    label: "Pazaryolu",
    productLine: "Hayvancılık · Orman ürünleri",
    dailyVolume: "—",
    memberCount: 0,
    registrationCount: 0,
  },
  senkaya: {
    label: "Şenkaya",
    productLine: "Hububat · Hayvancılık",
    dailyVolume: "—",
    memberCount: 0,
    registrationCount: 0,
  },
  tekman: {
    label: "Tekman",
    productLine: "Hububat · Yemlik",
    dailyVolume: "—",
    memberCount: 0,
    registrationCount: 0,
  },
  tortum: {
    label: "Tortum",
    productLine: "Hayvancılık · Meyve",
    dailyVolume: "—",
    memberCount: 0,
    registrationCount: 0,
  },
  uzundere: {
    label: "Uzundere",
    productLine: "Tarımsal üretim · Hayvancılık",
    dailyVolume: "—",
    memberCount: 0,
    registrationCount: 0,
  },
};
