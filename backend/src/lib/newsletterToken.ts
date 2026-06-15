import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * E-bülten abonelikten çıkma bağlantıları için durum gerektirmeyen HMAC imzası.
 * Token = HMAC-SHA256(jwtSecret, "newsletter-unsub:" + normalizedEmail)
 * E-posta gönderim aracı bu token'ı çıkış linkine ekler; endpoint doğrular.
 */
export function newsletterUnsubscribeToken(
  jwtSecret: string,
  email: string,
): string {
  const normalized = email.trim().toLowerCase();
  return createHmac("sha256", jwtSecret)
    .update(`newsletter-unsub:${normalized}`)
    .digest("hex");
}

export function verifyNewsletterUnsubscribeToken(
  jwtSecret: string,
  email: string,
  token: string,
): boolean {
  if (!/^[0-9a-f]{64}$/i.test(token)) return false;
  const expected = newsletterUnsubscribeToken(jwtSecret, email);
  return timingSafeEqual(
    Buffer.from(expected, "hex"),
    Buffer.from(token.toLowerCase(), "hex"),
  );
}

/** Çıkış sayfası URL'i (CSV dışa aktarımı ve e-posta şablonları için). */
export function newsletterUnsubscribeUrl(
  baseUrl: string,
  jwtSecret: string,
  email: string,
): string {
  const normalized = email.trim().toLowerCase();
  const token = newsletterUnsubscribeToken(jwtSecret, normalized);
  const params = new URLSearchParams({ email: normalized, token });
  return `${baseUrl.replace(/\/$/, "")}/e-bulten/ayril?${params.toString()}`;
}
