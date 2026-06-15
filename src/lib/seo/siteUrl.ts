const DEFAULT_SITE_URL = "https://www.erzurumtb.org.tr";

export const SITE_URL = (
  import.meta.env.VITE_SITE_URL?.trim() || DEFAULT_SITE_URL
).replace(/\/$/, "");

export const SITE_NAME = "Erzurum Ticaret Borsası";

export const DEFAULT_OG_IMAGE = "/erzurum-ticaret-borsasi-logo.png";

/** Set VITE_ALLOW_INDEXING=false on IP/staging deploys to emit noindex. */
export const ALLOW_INDEXING = import.meta.env.VITE_ALLOW_INDEXING !== "false";

export function absoluteUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export function pageUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return normalized === "/" ? SITE_URL : `${SITE_URL}${normalized}`;
}

export function formatPageTitle(pageTitle?: string | null): string {
  if (!pageTitle?.trim()) return `${SITE_NAME} — Doğu Anadolu'nun Ticaret Nabzı`;
  return `${pageTitle.trim()} | ${SITE_NAME}`;
}
