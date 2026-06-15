/** Use same-origin /uploads paths when the site proxies media through nginx. */
export function resolveMediaUrl(url: string): string {
  try {
    const parsed = new URL(url);
    if (
      typeof window !== "undefined" &&
      parsed.pathname.startsWith("/uploads/")
    ) {
      return `${window.location.origin}${parsed.pathname}`;
    }
  } catch {
    // ignore invalid URL
  }
  return url;
}
