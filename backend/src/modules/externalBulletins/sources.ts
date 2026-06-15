export type ExternalSourceKind = "databank-tescil" | "ktb-json";

export type ExternalBulletinSourceConfig = {
  id: string;
  name: string;
  shortName: string;
  sourceUrl: string;
  kind: ExternalSourceKind;
  /** DataBank base URL (trailing slash optional). */
  databankBaseUrl?: string;
  /** KTB Alpata JSON API prefix (same origin). */
  ktbApiBaseUrl?: string;
};

export const EXTERNAL_BULLETIN_SOURCES: ExternalBulletinSourceConfig[] = [
  {
    id: "ktb",
    name: "Konya Ticaret Borsası",
    shortName: "Konya TB",
    sourceUrl: "https://www.ktb.org.tr/anlikfiyat",
    kind: "ktb-json",
    ktbApiBaseUrl: "https://www.ktb.org.tr",
  },
  {
    id: "kiziltepe",
    name: "Kızıltepe Ticaret Borsası",
    shortName: "Kızıltepe TB",
    sourceUrl: "http://195.175.11.58:47847/Databank/Web/Data/?lno=2",
    kind: "databank-tescil",
    databankBaseUrl: "http://195.175.11.58:47847/Databank/Web/Data/",
  },
];

export function getExternalSource(id: string): ExternalBulletinSourceConfig | undefined {
  return EXTERNAL_BULLETIN_SOURCES.find((s) => s.id === id);
}
