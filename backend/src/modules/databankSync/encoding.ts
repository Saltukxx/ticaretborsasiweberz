import iconv from "iconv-lite";

const CHARSET_ALIASES: Record<string, string> = {
  "utf-8": "utf8",
  utf8: "utf8",
  "windows-1254": "win1254",
  "iso-8859-9": "win1254",
  latin5: "win1254",
};

export function hasTurkishLetters(s: string): boolean {
  return /[ğüşöçıİĞÜŞÖÇ]/.test(s);
}

/** Typical UTF-8-as-Latin1 mojibake (BUÄDAY, TÃ¼m Gruplar). */
export function looksMojibake(s: string): boolean {
  return /Ã.|Ä.|Å.|â€|Â./.test(s);
}

/** Names that cannot be shown after repair (legacy bad sync / replacement chars). */
export function isCorruptDisplayName(s: string): boolean {
  if (!s.trim()) return true;
  const repaired = repairUtf8Mojibake(s);
  if (/\uFFFD/.test(s) || /\uFFFD/.test(repaired)) return true;
  if (looksMojibake(repaired)) return true;
  if (/Sat1_|Al1_/.test(s) || /Sat1_|Al1_/.test(repaired)) return true;
  return false;
}

/** Repair UTF-8 bytes misread as single-byte (Latin-1) text. */
export function repairUtf8Mojibake(text: string): string {
  if (!looksMojibake(text)) return text;
  try {
    const fixed = Buffer.from(text, "latin1").toString("utf8");
    if (hasTurkishLetters(fixed) || !looksMojibake(fixed)) return fixed;
  } catch {
    /* keep original */
  }
  return text;
}

function resolveCharset(label: string): string | null {
  const key = label.toLowerCase().replace(/['"]/g, "").trim();
  return CHARSET_ALIASES[key] ?? null;
}

function parseCharsetFromContentType(ct: string | null): string | null {
  if (!ct) return null;
  const m = ct.match(/charset=([^;\s]+)/i);
  if (!m) return null;
  return resolveCharset(m[1]!);
}

function parseCharsetFromHtmlHead(buf: Buffer): string | null {
  const head = buf.subarray(0, 8192).toString("latin1");
  const m = head.match(/charset\s*=\s*["']?([\w-]+)/i);
  if (!m) return null;
  return resolveCharset(m[1]!);
}

function decodeWithCharset(buf: Buffer, charset: string): string {
  return repairUtf8Mojibake(iconv.decode(buf, charset));
}

/** Decode DataBank HTML using declared charset, then UTF-8 / win1254 heuristics. */
export function decodeHtmlBuffer(
  buf: Buffer,
  contentType?: string | null,
): string {
  const fromHeader = parseCharsetFromContentType(contentType ?? null);
  if (fromHeader) return decodeWithCharset(buf, fromHeader);

  const fromMeta = parseCharsetFromHtmlHead(buf);
  if (fromMeta) return decodeWithCharset(buf, fromMeta);

  const utf8 = buf.toString("utf8");
  const utf8Clean = repairUtf8Mojibake(utf8);
  if (hasTurkishLetters(utf8Clean) && !looksMojibake(utf8Clean)) {
    return utf8Clean;
  }

  const win1254 = iconv.decode(buf, "win1254");
  const winClean = repairUtf8Mojibake(win1254);
  if (hasTurkishLetters(winClean) && !looksMojibake(winClean)) {
    return winClean;
  }

  if (looksMojibake(utf8)) return utf8Clean;
  return utf8;
}
