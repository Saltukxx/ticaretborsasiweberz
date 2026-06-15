export type KvkkDocument = {
  slug: string;
  title: string;
  summary: string;
  fileName: string;
  sortOrder: number;
};

export const KVKK_DOCUMENTS: KvkkDocument[] = [
  {
    slug: "aydinlatma-internet",
    title: "İnternet Sitesi Aydınlatma Metni",
    summary:
      "Web sitemizi ziyaret edenler için kişisel verilerin işlenmesine ilişkin aydınlatma metni.",
    fileName: "aydinlatma-internet-sitesi.pdf",
    sortOrder: 1,
  },
  {
    slug: "kvkk-politikasi",
    title: "Kişisel Verilerin Korunması ve İşlenmesi Politikası",
    summary:
      "Erzurum Ticaret Borsası kişisel verilerin korunması, işlenmesi ve saklanmasına ilişkin genel politika.",
    fileName: "kvkk-politikasi.pdf",
    sortOrder: 2,
  },
  {
    slug: "ozel-nitelikli-veriler",
    title: "Özel Nitelikli Kişisel Verilerin Korunması ve İşlenmesi Politikası",
    summary:
      "Özel nitelikli kişisel verilerin işlenmesi, güvenliği ve saklanmasına ilişkin politika.",
    fileName: "ozel-nitelikli-veriler-politikasi.pdf",
    sortOrder: 3,
  },
  {
    slug: "gizlilik-cerez",
    title: "Gizlilik ve Çerez Politikası",
    summary:
      "Web sitesi gizlilik ilkeleri, çerez kullanımı ve tercih yönetimi hakkında bilgilendirme.",
    fileName: "gizlilik-ve-cerez-politikasi.pdf",
    sortOrder: 4,
  },
  {
    slug: "aydinlatma-calisan",
    title: "Çalışan Aydınlatma Metni",
    summary:
      "Borsamız çalışanlarının kişisel verilerinin işlenmesine ilişkin aydınlatma metni.",
    fileName: "aydinlatma-calisan.pdf",
    sortOrder: 5,
  },
];

/** Legacy /yasal/:slug → KVKK PDF slug redirects */
export const LEGAL_SLUG_REDIRECTS: Record<string, string> = {
  kvkk: "aydinlatma-internet",
  gizlilik: "gizlilik-cerez",
  cerez: "gizlilik-cerez",
};

export function getKvkkDocument(slug: string | undefined): KvkkDocument | undefined {
  if (!slug) return undefined;
  return KVKK_DOCUMENTS.find((d) => d.slug === slug);
}

export function kvkkDocumentPdfUrl(doc: KvkkDocument): string {
  return `/legal/${doc.fileName}`;
}

export function kvkkDocumentPagePath(slug: string): string {
  return `/kvkk/${slug}`;
}
