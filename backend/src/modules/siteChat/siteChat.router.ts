export type SiteChatIntent =
  | "off_topic"
  | "price"
  | "cms"
  | "out_of_scope"
  | "greeting"
  | "thanks";

const OFF_TOPIC_RE =
  /\b(yatırım|yatirim|al\s*sat|hisse|borsa\s*istanbul|bitcoin|kripto|siyaset|parti|seçim|secim|cumhurbaşkan|cumhurbaskan|erdoğan|erdogan|doktor|teşhis|teshis|avukat|dava|flört|flort|şaka|saka|hava\s*durumu|futbol)\b/i;

const INVESTMENT_ADVICE_RE =
  /\b(alay[ıi]m\s*m[ıi]|alsam\s*m[ıi]|satay[ıi]m\s*m[ıi]|tavsiye\s*ver|kar\s*eder|ne\s*zaman\s*al|ne\s*zaman\s*sat)/i;

const PRICE_RE =
  /\b(fiyat|bülten|bulten|ortalama|tescil|en\s*az|en\s*çok|en\s*cok|işlem\s*hacmi|islem\s*hacmi|kg|ton|buğday|bugday|arpa|patates|armut|pirinç|pirinc|domates|yumurta|soğan|sogan|biber|elma|muz|et\s|un\s|yağ|yag)\b/i;

const LIST_BULLETIN_RE =
  /\b(neler\s*var|hangi\s*ürün|hangi\s*urun|ürün\s*list|urun\s*list|tüm\s*ürün|tum\s*urun|bültende|bultende)\b/i;

const CMS_RE =
  /\b(haber|duyuru|etkinlik|yaklaşan|yaklasan|gündem|gundem|açıklama|aciklama|duyurular|haberler|etkinlikler)\b/i;

const ETB_RE =
  /\b(erzurum\s*ticaret|ticaret\s*borsas[ıi]|etb|erzurum\s*tb|borsa\s*web|borsamız|borsamiz)\b/i;

const GREETING_RE =
  /^(merhaba|selam|selamlar|iyi günler|iyi gunler|günaydın|gunaydin|hey|hoş geldin|hos geldin)(\s|$|[!.?,])/i;

const THANKS_RE =
  /^(teşekkür|tesekkur|teşekkürler|tesekkurler|sağol|sagol|sağ ol|sag ol|eyvallah|thanks)(\s|$|[!.?,])/i;

export function classifySiteChatIntent(message: string): SiteChatIntent {
  const t = message.trim();
  if (!t) return "out_of_scope";

  if (OFF_TOPIC_RE.test(t) || INVESTMENT_ADVICE_RE.test(t)) return "off_topic";

  if (PRICE_RE.test(t) || LIST_BULLETIN_RE.test(t)) return "price";

  if (CMS_RE.test(t)) return "cms";

  if (ETB_RE.test(t)) return "cms";

  if (GREETING_RE.test(t)) return "greeting";

  if (THANKS_RE.test(t)) return "thanks";

  return "out_of_scope";
}

export const GREETING_REPLY =
  "Merhaba. Erzurum Ticaret Borsası dijital asistanıyım. Haberler, duyurular, etkinlikler ve günlük tescil bülteni fiyatları hakkında sorularınızı yanıtlayabilirim.";

export const THANKS_REPLY =
  "Rica ederim. Başka bir sorunuz olursa yardımcı olmaktan memnuniyet duyarım.";

export const OUT_OF_SCOPE_REPLY =
  "Bu asistan yalnızca Erzurum Ticaret Borsası haber, duyuru, etkinlik ve günlük fiyat bülteni konularında yardımcı olur. Detay için ilgili sayfalarımıza göz atabilirsiniz: /haberler · /duyurular · /etkinlikler · /fiyat-bulteni";

export const OFF_TOPIC_REPLY =
  "Bu konuda yardımcı olamıyorum. Asistanımız yalnızca borsamızın haber, duyuru, etkinlik ve günlük tescil bülteni fiyat bilgileriyle sınırlıdır.";
