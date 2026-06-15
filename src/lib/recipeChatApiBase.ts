/** Shared base URL logic for recipe chat (mirrors publicApi getBase). */
export function getBase(): string {
  const configured = import.meta.env.VITE_API_URL as string | undefined;
  if (typeof window !== "undefined") {
    if (import.meta.env.DEV || import.meta.env.VITE_SAME_ORIGIN_API === "true") {
      return window.location.origin;
    }
    if (configured?.trim()) return configured.replace(/\/$/, "");
    return window.location.origin;
  }
  if (configured?.trim()) return configured.replace(/\/$/, "");
  throw new Error("VITE_API_URL is not set");
}
