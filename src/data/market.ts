export interface PricePoint {
  t: number;
  v: number;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  unit: string;
  avg: number;
  low: number;
  high: number;
  change: number;
  volume: string;
  updated: string;
  series: number[];
}

export const products: Product[] = [
  {
    id: "bugday",
    name: "Buğday",
    category: "Hububat",
    unit: "₺/kg",
    avg: 12.84,
    low: 11.95,
    high: 13.42,
    change: 1.8,
    volume: "284,5 ton",
    updated: "Bugün · 16:42",
    series: [10.2, 10.8, 11.1, 10.9, 11.6, 12.0, 12.3, 12.1, 12.6, 12.84],
  },
  {
    id: "arpa",
    name: "Arpa",
    category: "Hububat",
    unit: "₺/kg",
    avg: 9.65,
    low: 9.1,
    high: 10.05,
    change: -0.6,
    volume: "162,2 ton",
    updated: "Bugün · 16:39",
    series: [9.9, 9.85, 9.75, 9.7, 9.55, 9.6, 9.5, 9.62, 9.7, 9.65],
  },
  {
    id: "misir",
    name: "Mısır",
    category: "Hububat",
    unit: "₺/kg",
    avg: 8.42,
    low: 8.05,
    high: 8.78,
    change: 2.4,
    volume: "98,7 ton",
    updated: "Bugün · 16:30",
    series: [7.6, 7.7, 7.85, 8.0, 8.15, 8.1, 8.25, 8.3, 8.38, 8.42],
  },
  {
    id: "yemlik",
    name: "Yemlik Ürünler",
    category: "Yem",
    unit: "₺/kg",
    avg: 7.25,
    low: 6.9,
    high: 7.6,
    change: 0.9,
    volume: "212,8 ton",
    updated: "Bugün · 15:54",
    series: [6.8, 7.0, 7.05, 7.1, 7.0, 7.12, 7.18, 7.2, 7.22, 7.25],
  },
  {
    id: "bakliyat",
    name: "Bakliyat",
    category: "Tarımsal",
    unit: "₺/kg",
    avg: 28.4,
    low: 26.9,
    high: 30.2,
    change: 3.1,
    volume: "44,6 ton",
    updated: "Bugün · 15:20",
    series: [25.0, 25.6, 26.4, 26.9, 27.5, 27.8, 28.1, 28.0, 28.3, 28.4],
  },
  {
    id: "canli-hayvan",
    name: "Canlı Hayvan",
    category: "Hayvancılık",
    unit: "₺/kg CA",
    avg: 312.5,
    low: 298.0,
    high: 326.0,
    change: 1.2,
    volume: "1.284 baş",
    updated: "Bugün · 14:48",
    series: [285, 290, 295, 300, 302, 305, 309, 310, 311, 312.5],
  },
  {
    id: "sut-urunleri",
    name: "Süt Ürünleri",
    category: "Hayvancılık",
    unit: "₺/kg",
    avg: 38.9,
    low: 36.5,
    high: 41.2,
    change: -0.4,
    volume: "76,4 ton",
    updated: "Bugün · 14:22",
    series: [40.2, 39.8, 39.5, 39.1, 38.6, 38.8, 39.0, 38.9, 38.95, 38.9],
  },
  {
    id: "diger",
    name: "Diğer Ürünler",
    category: "Karışık",
    unit: "₺/kg",
    avg: 15.6,
    low: 14.2,
    high: 17.1,
    change: 0.5,
    volume: "58,3 ton",
    updated: "Bugün · 13:58",
    series: [14.6, 14.9, 15.0, 15.2, 15.3, 15.4, 15.5, 15.55, 15.58, 15.6],
  },
];

export const currencies = [
  { code: "USD/TRY", value: "32,7180", change: "+0,18%", up: true },
  { code: "EUR/TRY", value: "35,4920", change: "+0,24%", up: true },
  { code: "GBP/TRY", value: "41,2860", change: "-0,11%", up: false },
  { code: "ALTIN GR", value: "2.418,40", change: "+0,42%", up: true },
  { code: "BIST 100", value: "9.842,16", change: "+1,06%", up: true },
  { code: "BRENT", value: "82,14 $", change: "-0,38%", up: false },
  { code: "HUBUBAT END.", value: "1.284,5", change: "+0,72%", up: true },
];

export const announcements = [
  "Günlük fiyat bülteni yayınlandı — 16:45 itibarıyla geçerli",
  "Tescil işlemleri için güncel bilgilendirme yayında",
  "Üye işlemleri dijital başvuru ekranı üzerinden gerçekleştirilebilir",
  "Haftalık piyasa raporu erişime açıldı",
  "Laboratuvar analiz sonuçları için yeni randevu sistemi devrede",
  "Aralık ayı meclis toplantısı 14:00'te gerçekleştirilecektir",
];

export interface NewsItem {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  date: string;
  tone: "haber" | "duyuru" | "etkinlik" | "basin" | "sektor" | "rapor";
  big?: boolean;
}

export const news: NewsItem[] = [
  {
    id: "n1",
    title: "Erzurum'da Tarımsal Ticaretin Yeni Dönemi Başlıyor",
    excerpt:
      "Bölgesel üretici ile sanayiciyi buluşturan dijital tescil altyapısı, 2026 hasat döneminde tam kapasiteyle hizmete giriyor.",
    category: "Haber",
    date: "12 Mayıs 2026",
    tone: "haber",
    big: true,
  },
  {
    id: "n2",
    title: "Güncel Hububat Fiyatları Yayınlandı",
    excerpt:
      "Buğday ve arpa fiyatlarında ılımlı yükseliş; günlük ortalamalar yeni bültende.",
    category: "Duyuru",
    date: "12 Mayıs 2026",
    tone: "duyuru",
  },
  {
    id: "n3",
    title: "Üyelerimize Dijital Hizmet Kolaylığı",
    excerpt:
      "Tescil, belge talebi ve laboratuvar randevuları artık tek panel üzerinden yönetilebiliyor.",
    category: "Sektör",
    date: "10 Mayıs 2026",
    tone: "sektor",
  },
  {
    id: "n4",
    title: "Bölgesel Piyasa Değerlendirme Toplantısı Gerçekleştirildi",
    excerpt:
      "Doğu Anadolu illerinden tüccar, üretici ve odalar bir araya geldi; ortak veri paylaşımı kararlaştırıldı.",
    category: "Etkinlik",
    date: "08 Mayıs 2026",
    tone: "etkinlik",
  },
  {
    id: "n5",
    title: "Yeni Dönem Borsa Raporları Yayında",
    excerpt:
      "Aylık değerlendirme ve sektörel analiz raporları açık erişimle paylaşıma sunuldu.",
    category: "Rapor",
    date: "06 Mayıs 2026",
    tone: "rapor",
  },
  {
    id: "n6",
    title: "Basın Açıklaması: Yeni Hizmet Binası Çalışmaları",
    excerpt:
      "Modern üye hizmetleri için inşası süren yeni hizmet binasının ilerleme raporu paylaşıldı.",
    category: "Basın Açıklaması",
    date: "02 Mayıs 2026",
    tone: "basin",
  },
];

export const reports = [
  {
    id: "r1",
    name: "Günlük Borsa Raporu",
    date: "12 Mayıs 2026",
    type: "Günlük",
    summary:
      "Hububat, bakliyat ve canlı hayvan piyasalarında günlük fiyat hareketleri ve işlem hacimleri.",
    size: "1,2 MB · PDF",
  },
  {
    id: "r2",
    name: "Haftalık Piyasa Özeti",
    date: "Hafta 19, 2026",
    type: "Haftalık",
    summary:
      "Buğday, arpa, mısır ve yemlik ürünlerde haftalık trendler ve karşılaştırmalı analiz.",
    size: "2,4 MB · PDF",
  },
  {
    id: "r3",
    name: "Aylık Değerlendirme",
    date: "Nisan 2026",
    type: "Aylık",
    summary:
      "Bölgesel üretim, ticaret ve fiyat seyrine ilişkin kapsamlı aylık değerlendirme.",
    size: "5,8 MB · PDF",
  },
  {
    id: "r4",
    name: "Sektörel Analiz Raporu",
    date: "Ç1 2026",
    type: "Sektör",
    summary:
      "Doğu Anadolu hububat ve hayvancılık sektörlerinin çeyrek bazlı dijital özet raporu.",
    size: "9,1 MB · PDF",
  },
  {
    id: "r5",
    name: "Ürün Bazlı Fiyat Analizi",
    date: "Mayıs 2026",
    type: "Ürün",
    summary:
      "Buğday, arpa, mısır, bakliyat ve canlı hayvan ürün gruplarında detaylı fiyat eğilimleri.",
    size: "3,5 MB · PDF",
  },
];

export const services = [
  { id: "uye", title: "Üye İşlemleri", desc: "Üyelik başvurusu, güncelleme ve aidat yönetimi.", icon: "user" },
  { id: "tescil", title: "Tescil İşlemleri", desc: "Alım-satım tescili, beyanname ve onay süreçleri.", icon: "stamp" },
  { id: "lab", title: "Laboratuvar Hizmetleri", desc: "Hububat ve gıda ürünleri için akredite analiz.", icon: "flask" },
  { id: "belge", title: "Belge Talepleri", desc: "Faaliyet, yetki ve sicil belgeleri için hızlı talep.", icon: "doc" },
  { id: "eislem", title: "Elektronik İşlemler", desc: "Üyeler için uçtan uca dijital işlem paneli.", icon: "spark" },
  { id: "mevzuat", title: "Mevzuat", desc: "Yönetmelik, tebliğ ve kurumsal düzenlemeler.", icon: "book" },
  { id: "ilan", title: "İlanlar", desc: "Üye ve kurumsal ilanlar için duyuru alanı.", icon: "megaphone" },
  { id: "ihale", title: "İhale Duyuruları", desc: "Güncel ihale süreçleri ve katılım koşulları.", icon: "gavel" },
];

export const stats = [
  { label: "Günlük İşlem Hacmi", value: 284.5, suffix: " ton", note: "Hububat + bakliyat" },
  { label: "Aktif Üye Sayısı", value: 1842, suffix: "", note: "Üretici · tüccar · sanayici" },
  { label: "Tescil İşlemleri", value: 12640, suffix: "", note: "Yıl başından itibaren" },
  { label: "Güncel Ürün Kalemi", value: 142, suffix: "", note: "Aktif fiyat bültenindeki" },
  { label: "Yayınlanan Bültenler", value: 1280, suffix: "", note: "Son 12 ayda" },
  { label: "Kurumsal Hizmetler", value: 24, suffix: "", note: "Dijital ve fiziksel" },
];
