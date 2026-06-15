export function stripHtmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function truncateAtWord(text: string, maxLen: number): string {
  const t = text.trim();
  if (t.length <= maxLen) return t;
  const slice = t.slice(0, maxLen);
  const cut = slice.lastIndexOf(" ");
  const base = cut > maxLen * 0.55 ? slice.slice(0, cut) : slice;
  return `${base.trimEnd()}…`;
}

function looksTruncated(excerpt: string): boolean {
  const t = excerpt.trim();
  if (t.length < 100) return false;
  if (/[.!?…][\)"'"]?$/.test(t)) return false;
  if (t.endsWith("…")) return false;
  return true;
}

/** Detay sayfası: DB özet kesikse gövdeden tam lead al. */
export function resolveNewsLead(
  excerpt: string | null | undefined,
  bodyHtml?: string | null,
): string {
  const ex = (excerpt ?? "").trim();
  const bodyText = bodyHtml ? stripHtmlToText(bodyHtml) : "";
  if (!bodyText) return ex;

  if (looksTruncated(ex) || bodyText.length > ex.length + 40) {
    const firstBlock = bodyText.split(/\n{2,}/)[0] ?? bodyText;
    const lead = firstBlock.length > 520 ? truncateAtWord(firstBlock, 520) : firstBlock;
    if (!ex || lead.length >= ex.length) return lead;
  }

  return ex;
}
