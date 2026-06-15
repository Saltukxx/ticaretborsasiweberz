/** Allow same-origin paths and http(s)/mailto URLs only. */
export function isSafeHref(href: string): boolean {
  const trimmed = href.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) return true;
  try {
    const u = new URL(trimmed);
    return u.protocol === "http:" || u.protocol === "https:" || u.protocol === "mailto:";
  } catch {
    return false;
  }
}

/** Returns the href if safe, otherwise a harmless fallback. */
export function safeHref(href: string | null | undefined, fallback = "#"): string {
  if (href && isSafeHref(href)) return href;
  return fallback;
}
