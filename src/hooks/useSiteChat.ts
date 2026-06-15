import { useCallback, useEffect, useRef, useState } from "react";
import { getChatSessionId } from "../lib/chatSessionId";
import {
  postSiteChat,
  SiteChatApiError,
  type SiteChatHistoryTurn,
} from "../lib/siteChatApi";

const HISTORY_MAX = 8;
const STORAGE_KEY = "etb:site-chat:messages";

export type SiteChatMessage = {
  id: string;
  role: "user" | "bot";
  content: string;
  timestamp: number;
};

const WELCOME =
  "Merhaba. Erzurum Ticaret Borsası dijital asistanıyım. Haberler, duyurular, etkinlikler ve günlük tescil bülteni fiyatları hakkında yardımcı olabilirim.";

export const SITE_CHAT_SUGGESTIONS = [
  "Son duyurular?",
  "Yaklaşan etkinlikler?",
  "Patates fiyatı?",
  "Bugün bültende neler var?",
];

function uid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function toHistory(messages: SiteChatMessage[]): SiteChatHistoryTurn[] {
  return messages
    .filter((m) => m.content.trim())
    .slice(-HISTORY_MAX)
    .map((m) => ({
      role: m.role === "user" ? "user" : "model",
      text: m.content,
    }));
}

function readStored(): SiteChatMessage[] | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SiteChatMessage[];
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function persist(messages: SiteChatMessage[]): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-30)));
  } catch {
    /* ignore */
  }
}

export function useSiteChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<SiteChatMessage[]>(() => {
    const stored = readStored();
    if (stored?.length) return stored;
    return [{ id: uid(), role: "bot", content: WELCOME, timestamp: Date.now() }];
  });
  const [isTyping, setIsTyping] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const sessionIdRef = useRef(getChatSessionId("site"));

  useEffect(() => {
    persist(messages);
  }, [messages]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isTyping) return;

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      const user: SiteChatMessage = {
        id: uid(),
        role: "user",
        content: trimmed,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, user]);
      setIsTyping(true);

      try {
        const history = toHistory([...messages, user].slice(0, -1));
        const { reply } = await postSiteChat(
          trimmed,
          history,
          controller.signal,
          sessionIdRef.current,
        );
        setMessages((prev) => [
          ...prev,
          { id: uid(), role: "bot", content: reply, timestamp: Date.now() },
        ]);
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
        const fallback =
          err instanceof SiteChatApiError
            ? err.message
            : "Yanıt oluşturulamadı. Lütfen tekrar deneyin.";
        setMessages((prev) => [
          ...prev,
          { id: uid(), role: "bot", content: fallback, timestamp: Date.now() },
        ]);
      } finally {
        setIsTyping(false);
      }
    },
    [isTyping, messages],
  );

  const toggle = useCallback(() => setOpen((v) => !v), []);
  const close = useCallback(() => setOpen(false), []);

  return {
    open,
    toggle,
    close,
    messages,
    isTyping,
    sendMessage,
  };
}
