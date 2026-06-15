/** Only allow same-origin relative paths after login (blocks open redirects). */
export function safeRedirectPath(from: string | undefined, fallback = "/dashboard"): string {
  if (!from || !from.startsWith("/") || from.startsWith("//")) {
    return fallback;
  }
  return from;
}
