/** Düz metni kelime sınırında kısaltır (ortadan kesmez). */
export function truncateAtWord(text: string, maxLen: number): string {
  const t = text.trim();
  if (t.length <= maxLen) return t;
  const slice = t.slice(0, maxLen);
  const cut = slice.lastIndexOf(" ");
  const base = cut > maxLen * 0.55 ? slice.slice(0, cut) : slice;
  return `${base.trimEnd()}…`;
}

export function stripHtmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** İlk paragraf veya jsonLd açıklamasından haber özeti üretir. */
export function buildNewsExcerpt(
  bodyHtml: string,
  fallbackTitle: string,
  jsonLdDescription?: string | null,
  maxLen = 480,
): string {
  const fromJson = jsonLdDescription?.trim();
  if (fromJson && fromJson.length >= 40) {
    return truncateAtWord(fromJson, maxLen);
  }
  const plain = stripHtmlToText(bodyHtml);
  if (plain.length >= 40) {
    return truncateAtWord(plain, maxLen);
  }
  return fallbackTitle;
}
