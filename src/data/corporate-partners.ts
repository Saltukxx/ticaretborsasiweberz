export interface CorporatePartner {
  id: string;
  name: string;
  logo: string;
}

/** Kurumsal iş ortakları — logolar public/partners/ altında */
export const CORPORATE_PARTNERS: CorporatePartner[] = [
  { id: "l1", name: "Partner 1", logo: "/partners/l1.png" },
  { id: "l2", name: "Partner 2", logo: "/partners/l2.png" },
  { id: "l4", name: "Partner 3", logo: "/partners/l4.png" },
  { id: "l5", name: "Partner 4", logo: "/partners/l5.png" },
  { id: "l6", name: "Partner 5", logo: "/partners/l6.png" },
  { id: "l7", name: "Partner 6", logo: "/partners/l7.png" },
  { id: "abigem", name: "ABİGEM", logo: "/partners/abigem.png" },
  { id: "ata-teknokent", name: "ATA TEKNOKENT", logo: "/partners/ata-teknokent.png" },
  { id: "erzurum-carsi-pazar", name: "Erzurum Çarşı Pazar", logo: "/partners/erzurum-carsi-pazar.png" },
  { id: "gumruk-ve-turizm", name: "Gümrük ve Turizm İşletmeleri", logo: "/partners/gumruk-ve-turizm.png" },
  { id: "iso-9000", name: "ISO 9000", logo: "/partners/iso-9000.png" },
  { id: "icn", name: "International Certification Network", logo: "/partners/icn.png" },
  { id: "kobi", name: "KOBİ", logo: "/partners/kobi.png" },
  { id: "kgf", name: "Kredi Garanti Fonu", logo: "/partners/kgf.png" },
  { id: "lisansli-depoculuk", name: "Lisanslı Depoculuk", logo: "/partners/lisansli-depoculuk.png" },
  { id: "mezopotamya", name: "Mezopotamya", logo: "/partners/mezopotamya.png" },
  { id: "mupak", name: "MÜPAK", logo: "/partners/mupak.png" },
  { id: "tarim-ve-hayvancilik", name: "Tarım ve Hayvancılık", logo: "/partners/tarim-ve-hayvancilik.png" },
  { id: "turib", name: "TÜRİB", logo: "/partners/turib.png" },
  { id: "yorez", name: "YÖREZ", logo: "/partners/yorez.png" },
];
