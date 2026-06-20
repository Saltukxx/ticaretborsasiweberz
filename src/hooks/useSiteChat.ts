import { useCallback, useEffect, useRef, useState } from "react";
import { getChatSessionId } from "../lib/chatSessionId";
import { lockBodyScroll, unlockBodyScroll } from "../lib/bodyScrollLock";
import {
  postSiteChat,
  SiteChatApiError,
  type SiteChatHistoryTurn,
} from "../lib/siteChatApi";

const HISTORY_MAX = 6;
const STORAGE_KEY = "etb:site-chat:messages";
const MOBILE_MQ = "(max-width: 720px)";

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
  "Bugün bültende neler var?",
  "Güncel bülten fiyatları?",
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
    const root = document.documentElement;
    if (open) {
      root.classList.add("site-chat-open");
    } else {
      root.classList.remove("site-chat-open");
    }
    return () => root.classList.remove("site-chat-open");
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const mq = window.matchMedia(MOBILE_MQ);
    if (!mq.matches) return;

    lockBodyScroll("site-chat");
    return () => unlockBodyScroll("site-chat");
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

      const botId = uid();
      let streamStarted = false;

      try {
        const history = toHistory([...messages, user].slice(0, -1));
        const { reply } = await postSiteChat(
          trimmed,
          history,
          controller.signal,
          sessionIdRef.current,
          (delta) => {
            if (!streamStarted) {
              streamStarted = true;
              setIsTyping(false);
              setMessages((prev) => [
                ...prev,
                { id: botId, role: "bot", content: delta, timestamp: Date.now() },
              ]);
              return;
            }
            setMessages((prev) =>
              prev.map((m) =>
                m.id === botId ? { ...m, content: m.content + delta } : m,
              ),
            );
          },
        );
        if (!streamStarted) {
          setMessages((prev) => [
            ...prev,
            { id: botId, role: "bot", content: reply, timestamp: Date.now() },
          ]);
        }
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
