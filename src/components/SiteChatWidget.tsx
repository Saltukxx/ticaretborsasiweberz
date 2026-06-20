import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  SITE_CHAT_SUGGESTIONS,
  useSiteChat,
} from "../hooks/useSiteChat";
import { useVisualViewport } from "../hooks/useVisualViewport";
import { SiteChatMessageContent } from "../lib/siteChatMarkdown";
import { ChatKvkkNotice } from "./ChatKvkkNotice";
import "./SiteChatWidget.css";

function ChatIcon() {
  return (
    <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 3C7.03 3 3 6.58 3 11c0 2.01.9 3.85 2.38 5.24L4 21l4.96-1.28A9.8 9.8 0 0 0 12 19c4.97 0 9-3.58 9-8s-4.03-8-9-8Z"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <path
        fill="currentColor"
        d="M6.4 5.01 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41 17.59 5 12 10.59Z"
      />
    </svg>
  );
}

export default function SiteChatWidget() {
  const titleId = useId();
  const {
    open,
    toggle,
    close,
    messages,
    isTyping,
    sendMessage,
  } = useSiteChat();
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fabRef = useRef<HTMLButtonElement>(null);
  const wasOpenRef = useRef(false);

  useVisualViewport(open);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, isTyping, open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  useEffect(() => {
    if (wasOpenRef.current && !open) {
      fabRef.current?.focus();
    }
    wasOpenRef.current = open;
  }, [open]);

  const submit = () => {
    const t = draft.trim();
    if (!t) return;
    setDraft("");
    void sendMessage(t);
  };

  const layer =
    open &&
    createPortal(
      <>
        <div className="site-chat-backdrop" onClick={close} aria-hidden />
        <div
          className="site-chat-panel site-chat-panel--open"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
        >
          <header className="site-chat-panel__header">
            <div>
              <h2 id={titleId} className="site-chat-panel__title">
                Borsa Asistanı
              </h2>
              <p className="site-chat-panel__sub">
                Haber · Duyuru · Etkinlik · Bülten
              </p>
            </div>
            <button
              type="button"
              className="site-chat-panel__close"
              onClick={close}
              aria-label="Kapat"
            >
              <CloseIcon />
            </button>
          </header>

          <div className="site-chat-panel__messages" ref={scrollRef} role="log">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`site-chat-bubble site-chat-bubble--${msg.role}`}
              >
                <SiteChatMessageContent text={msg.content} />
              </div>
            ))}
            {isTyping && (
              <div className="site-chat-bubble site-chat-bubble--bot site-chat-typing">
                <span />
                <span />
                <span />
              </div>
            )}
          </div>

          <div className="site-chat-panel__suggestions-wrap">
            <p className="site-chat-panel__suggestions-label">Örnek sorular</p>
            <div className="site-chat-panel__suggestions" aria-label="Örnek sorular">
              {SITE_CHAT_SUGGESTIONS.map((label) => (
                <button
                  key={label}
                  type="button"
                  className="site-chat-chip"
                  onClick={() => void sendMessage(label)}
                  disabled={isTyping}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <form
            className="site-chat-panel__form"
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
          >
            <textarea
              ref={inputRef}
              className="site-chat-panel__input"
              rows={1}
              value={draft}
              placeholder="Sorunuzu yazın…"
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  submit();
                }
              }}
              disabled={isTyping}
              aria-label="Mesaj"
            />
            <button
              type="submit"
              className="site-chat-panel__send"
              disabled={isTyping || !draft.trim()}
            >
              Gönder
            </button>
          </form>
          <ChatKvkkNotice className="site-chat-panel__kvkk" />
        </div>
      </>,
      document.body,
    );

  return (
    <>
      {!open && (
        <button
          ref={fabRef}
          type="button"
          className="site-chat-fab"
          onClick={toggle}
          aria-label="Borsa asistanı"
          title="Borsa Asistanı"
        >
          <ChatIcon />
        </button>
      )}
      {layer}
    </>
  );
}
