const SESSION_KEY_PREFIX = "etb:chat-session:";

/** Stable per-tab session id for KVKK chat logging correlation. */
export function getChatSessionId(scope: "site" | "recipe"): string {
  const key = `${SESSION_KEY_PREFIX}${scope}`;
  try {
    const existing = sessionStorage.getItem(key);
    if (existing) return existing;
    const id = crypto.randomUUID();
    sessionStorage.setItem(key, id);
    return id;
  } catch {
    return crypto.randomUUID();
  }
}
