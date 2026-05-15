export type PlannedEventCategory = "Toplantı" | "Eğitim" | "Panel" | "Saha Programı";
export type PlannedEventStatus = "Kayıt Açık" | "Planlandı" | "Kontenjan Sınırlı";

export interface PlannedEvent {
  id: string;
  title: string;
  category: PlannedEventCategory;
  /** yyyy-mm-dd — sıralama ve önizleme için */
  sortKey: string;
  dateLabel: string;
  time: string;
  location: string;
  audience: string;
  status: PlannedEventStatus;
  summary: string;
  details: string[];
  /** Projeler sayfası önizlemesinde vurgu için kısa etiket */
  projectNote?: string;
}

const plannedEventsUnsorted: PlannedEvent[] = [
  {
    id: "eva-1",
    title: "Bölgesel Piyasa Değerlendirme Toplantısı",
    category: "Toplantı",
    sortKey: "2026-05-28",
    dateLabel: "28 Mayıs 2026",
    time: "10:00 — 12:30",
    location: "ETB Toplantı Salonu",
    audience: "Üyeler, Borsa Meclisi, sektör temsilcileri",
    status: "Kayıt Açık",
    summary:
      "Hububat ve hayvansal ürünlerde haftalık fiyat eğilimleri, arz-talep dengesi ve bölgesel göstergelerin birlikte değerlendirileceği kurumsal toplantı.",
    details: [
      "Piyasa bilgi notları ve son dönem bülten özeti",
      "İlçe bazlı ürün hareketleri üzerine paylaşım",
      "Takip edilecek rapor ve veri setleri",
    ],
    projectNote: "Bölgesel Üretici Veri Merkezi çıktılarıyla ilişkili",
  },
  {
    id: "eva-2",
    title: "Dijital Üye Hizmetleri Eğitimi",
    category: "Eğitim",
    sortKey: "2026-06-04",
    dateLabel: "4 Haziran 2026",
    time: "14:00 — 16:00",
    location: "Hibrit · ETB + çevrim içi katılım",
    audience: "Üyeler ve idari personel",
    status: "Kontenjan Sınırlı",
    summary:
      "Yeni dijital başvuru, belge takibi ve üye paneli süreçlerinin uçtan uca anlatıldığı uygulamalı eğitim oturumu.",
    details: [
      "Online başvuru ve belge yükleme adımları",
      "Üye paneli ve bildirim tercihleri",
      "Sık karşılaşılan sorunlar ve destek kanalları",
    ],
    projectNote: "Dijital Tescil ve Üye İşlem Altyapısı pilotu",
  },
  {
    id: "eva-3",
    title: "Hububat Kalite ve Analiz Paneli",
    category: "Panel",
    sortKey: "2026-06-12",
    dateLabel: "12 Haziran 2026",
    time: "09:30 — 12:00",
    location: "ETB Konferans Alanı",
    audience: "Üreticiler, laboratuvar paydaşları, üyeler",
    status: "Planlandı",
    summary:
      "Numune alma, analiz standartları ve laboratuvar hizmet süreçlerinin şeffaflığının artırılmasına yönelik panel.",
    details: [
      "Kalite parametreleri ve raporlama dili",
      "Randevu ve sonuç bildirimi süreçleri",
      "Bölgesel ürün güvenliği ve izlenebilirlik",
    ],
    projectNote: "Laboratuvar Modernizasyon Programı kapsamı",
  },
  {
    id: "eva-4",
    title: "İlçe Üretici Buluşması — Horasan",
    category: "Saha Programı",
    sortKey: "2026-06-19",
    dateLabel: "19 Haziran 2026",
    time: "11:00 — 13:00",
    location: "Horasan İlçe Koordinasyonu",
    audience: "Yerel üreticiler, kooperatifler, üyeler",
    status: "Kayıt Açık",
    summary:
      "Saha geri bildirimi, piyasa beklentileri ve borsa hizmetlerinin yerinde anlatımı için planlanan buluşma.",
    details: [
      "Ürün tescil ve piyasa bilgilendirme masası",
      "Bölgesel veri ve bültenlere erişim",
      "Talep ve öneri kayıt süreci",
    ],
    projectNote: "Bölgesel kalkınma ve üretici iletişimi",
  },
  {
    id: "eva-5",
    title: "Ticaret Hukuku ve Sözleşme Okuryazarlığı Semineri",
    category: "Eğitim",
    sortKey: "2026-07-03",
    dateLabel: "3 Temmuz 2026",
    time: "10:30 — 12:30",
    location: "ETB Eğitim Salonu",
    audience: "Üyeler ve tüccar temsilcileri",
    status: "Planlandı",
    summary:
      "Tarımsal ticarette yaygın sözleşme türleri, riskleri ve kurumsal yönlendirme imkânlarına odaklı bilgilendirme semineri.",
    details: [
      "Temel ticari belgeler ve dikkat edilecek maddeler",
      "Uyumsuzluk durumunda kurumsal yönlendirme",
      "Soru-cevap ve örnek senaryolar",
    ],
  },
  {
    id: "eva-6",
    title: "Kurumsal Şeffaflık ve Raporlama Paylaşımı",
    category: "Toplantı",
    sortKey: "2026-07-17",
    dateLabel: "17 Temmuz 2026",
    time: "15:00 — 16:30",
    location: "ETB · Hibrit",
    audience: "Üyeler, basın ve paydaş kurumlar",
    status: "Planlandı",
    summary:
      "Yayınlanan rapor seti, gösterge kartları ve veri güncelleme takviminin paydaşlarla paylaşılacağı brifing toplantısı.",
    details: [
      "Standart rapor takvimi ve erişim noktaları",
      "Yeni dönem piyasa raporları özeti",
      "Geri bildirim ve iş birliği önerileri",
    ],
  },
];

export const plannedEvents = [...plannedEventsUnsorted].sort((a, b) => a.sortKey.localeCompare(b.sortKey));

export function getUpcomingEvents(limit?: number): PlannedEvent[] {
  const list = [...plannedEvents];
  return typeof limit === "number" ? list.slice(0, limit) : list;
}

export function countOpenRegistration(events: PlannedEvent[]): number {
  return events.filter((e) => e.status === "Kayıt Açık").length;
}

/** Toplantı, panel ve saha programı sayısı — paydaş odaklı program özet göstergesi */
export function countStakeholderPrograms(events: PlannedEvent[]): number {
  return events.filter((e) => e.category !== "Eğitim").length;
}
