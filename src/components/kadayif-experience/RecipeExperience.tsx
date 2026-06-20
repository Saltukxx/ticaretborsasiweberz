import {
  useRef,
  useEffect,
  useState,
  useCallback,
  type FormEvent,
  type RefObject,
  type MouseEvent,
} from "react";
import NarratorAvatar, {
  type NarratorAvatarState,
} from "./NarratorAvatar";
import {
  formatVideoTime,
  videoProgressPercent,
} from "../../lib/recipeVideoSync";
import type { ChatMessage, RecipeChatReplyMode, VideoProgress } from "../../hooks/useRecipeChat";
import { ChatKvkkNotice } from "../ChatKvkkNotice";
import type { RecipeStep } from "../../data/kadayif-dolmasi-recipe";

/* ------------------------------------------------------------------ */
/*  Self-hosted HTML5 video — iki yönlü adım senkronu                  */
/* ------------------------------------------------------------------ */

interface VideoProps {
  videoRef: RefObject<HTMLVideoElement | null>;
  videoSrc: string;
  videoCredit?: string;
  currentStep: number;
  totalSteps: number;
  stepTitle: string;
  steps: RecipeStep[];
  videoProgress: VideoProgress;
  isVideoPlaying: boolean;
  onTogglePlay: () => void;
  onTimeUpdate: (currentTime: number, duration: number) => void;
  onLoadedMetadata: (duration: number) => void;
  onEnded: () => void;
  onPlay: () => void;
  onPause: () => void;
  onProgressSeek: (time: number) => void;
}

export function RecipeVideoPlayer({
  videoRef,
  videoSrc,
  videoCredit,
  currentStep,
  totalSteps,
  stepTitle,
  steps,
  videoProgress,
  isVideoPlaying,
  onTogglePlay,
  onTimeUpdate,
  onLoadedMetadata,
  onEnded,
  onPlay,
  onPause,
  onProgressSeek,
}: VideoProps) {
  const progressPct = videoProgressPercent(
    videoProgress.currentTime,
    videoProgress.duration,
  );

  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    onTimeUpdate(video.currentTime, video.duration || videoProgress.duration);
  }, [videoRef, onTimeUpdate, videoProgress.duration]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onMeta = () => onLoadedMetadata(video.duration);
    video.addEventListener("loadedmetadata", onMeta);
    return () => video.removeEventListener("loadedmetadata", onMeta);
  }, [videoSrc, videoRef, onLoadedMetadata]);

  const handleProgressClick = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      const duration = videoProgress.duration;
      if (!duration || duration <= 0) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const pct = (e.clientX - rect.left) / rect.width;
      onProgressSeek(pct * duration);
    },
    [onProgressSeek, videoProgress.duration],
  );

  return (
    <div className="kd-video">
      <div className="kd-video__wrapper kd-video__wrapper--hosted">
        <video
          ref={videoRef as RefObject<HTMLVideoElement>}
          key={videoSrc}
          className="kd-video__element"
          src={videoSrc}
          title="Kadayıf Dolması Yapılışı"
          playsInline
          preload="metadata"
          onTimeUpdate={handleTimeUpdate}
          onEnded={onEnded}
          onPlay={onPlay}
          onPause={onPause}
        />

        <button
          type="button"
          className={`kd-video__center-play ${isVideoPlaying ? "is-hidden" : ""}`}
          onClick={onTogglePlay}
          aria-label={currentStep === 0 ? "Tarife başla ve oynat" : "Videoyu oynat"}
        >
          ▶
        </button>

        {videoCredit && (
          <span className="kd-video__credit mono">{videoCredit}</span>
        )}

        {currentStep > 0 && (
          <div className="kd-video__step-badge">
            <span className="kd-video__step-num mono">
              {String(currentStep).padStart(2, "0")} / {String(totalSteps).padStart(2, "0")}
            </span>
            <span className="kd-video__step-title">{stepTitle}</span>
          </div>
        )}
      </div>

      <div className="kd-video__progress-wrap">
        <div
          className="kd-video__progress"
          role="slider"
          aria-label="Video ilerlemesi"
          aria-valuemin={0}
          aria-valuemax={videoProgress.duration || 100}
          aria-valuenow={videoProgress.currentTime}
          tabIndex={0}
          onClick={handleProgressClick}
          onKeyDown={(e) => {
            if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
              e.preventDefault();
              const delta = e.key === "ArrowRight" ? 5 : -5;
              onProgressSeek(videoProgress.currentTime + delta);
            }
          }}
        >
          <div
            className="kd-video__progress-fill"
            style={{ width: `${progressPct}%` }}
          />
          {steps.map((step) => {
            const pct =
              videoProgress.duration > 0
                ? (step.videoTimestamp / videoProgress.duration) * 100
                : 0;
            return (
              <span
                key={step.id}
                className={`kd-video__progress-marker ${
                  currentStep === step.id ? "is-active" : currentStep > step.id ? "is-past" : ""
                }`}
                style={{ left: `${pct}%` }}
                aria-hidden
              />
            );
          })}
        </div>
        <div className="kd-video__time mono">
          <span>{formatVideoTime(videoProgress.currentTime)}</span>
          <span className="kd-video__time-sep">/</span>
          <span>{formatVideoTime(videoProgress.duration || 60)}</span>
        </div>
      </div>
    </div>
  );
}

const RECIPE_CHAT_DEFAULT_SUGGESTIONS = [
  "Tarife başla",
  "Videoyu durdur",
  "Kızartma adımına git",
  "Coğrafi işaret nedir?",
] as const;

/* ------------------------------------------------------------------ */
/*  Chat Panel                                                         */
/* ------------------------------------------------------------------ */

interface ChatProps {
  messages: ChatMessage[];
  isTyping: boolean;
  currentStep: number;
  totalSteps: number;
  isVideoPlaying?: boolean;
  awaitingContinue?: boolean;
  suggestions?: string[];
  replyMode?: RecipeChatReplyMode;
  onResetChat?: () => void;
  onSend: (text: string) => void;
  onNext: () => void;
  onPrev: () => void;
}

function resolveNarratorState(
  isTyping: boolean,
  messages: ChatMessage[],
): NarratorAvatarState {
  if (isTyping) return "speaking";
  const last = messages[messages.length - 1];
  if (last?.role === "user") return "listening";
  return "idle";
}

export function RecipeChat({
  messages,
  isTyping,
  currentStep,
  totalSteps,
  isVideoPlaying = false,
  awaitingContinue = false,
  suggestions,
  replyMode = "live",
  onResetChat,
  onSend,
  onNext,
  onPrev,
}: ChatProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState("");
  const narratorState = resolveNarratorState(isTyping, messages);

  const statusLabel = awaitingContinue
    ? "Adım tamamlandı — devam edin"
    : isVideoPlaying
      ? "Video eşlik ediyor"
      : "Hazır";

  const primaryLabel = awaitingContinue
    ? "Devam Et →"
    : currentStep === 0
      ? "Tarife Başla"
      : currentStep >= totalSteps
        ? "Tamamlandı ✓"
        : "Sonraki Adım →";

  const primaryDisabled = currentStep >= totalSteps && !awaitingContinue;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages, isTyping]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!draft.trim()) return;
    onSend(draft);
    setDraft("");
    inputRef.current?.focus();
  }

  return (
    <div className="kd-chat">
      <div className="kd-chat__header">
        <div className="kd-chat__header-avatar">
          <NarratorAvatar variant="header" state={narratorState} />
        </div>
        <div className="kd-chat__header-info">
          <strong>Kültürel Anlatıcı</strong>
          <span className="mono">Erzurum Ticaret Borsası</span>
        </div>
        <div className="kd-chat__header-actions">
          <span
            className={`kd-chat__reply-badge kd-chat__reply-badge--${replyMode}`}
            title={
              replyMode === "live"
                ? "Yanıtlar yapay zekâ sunucusu üzerinden geliyor"
                : "Yanıtlar yerel rehber modunda (API kullanılamıyor)"
            }
          >
            {replyMode === "live" ? "Canlı yanıt" : "Yerel rehber"}
          </span>
          {onResetChat && (
            <button
              type="button"
              className="kd-chat__reset-btn"
              onClick={onResetChat}
            >
              Sohbeti temizle
            </button>
          )}
        </div>
        <div className="kd-chat__header-status">
          <span
            className={`kd-chat__status-dot ${
              isVideoPlaying ? "is-syncing" : awaitingContinue ? "is-awaiting" : ""
            }`}
          />
          {statusLabel}
        </div>
      </div>

      <div
        className="kd-chat__messages"
        ref={scrollRef}
        role="log"
        aria-live="polite"
      >
        {messages.map((msg) => (
          <div
            className={`kd-chat__bubble kd-chat__bubble--${msg.role}`}
            key={msg.id}
          >
            {msg.role === "bot" && (
              <div className="kd-chat__bubble-avatar">
                <NarratorAvatar variant="bubble" state="idle" />
              </div>
            )}
            <div className="kd-chat__bubble-content">
              <MessageContent text={msg.content} />
              <time className="kd-chat__time mono">
                {new Date(msg.timestamp).toLocaleTimeString("tr-TR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </time>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="kd-chat__bubble kd-chat__bubble--bot">
            <div className="kd-chat__bubble-avatar">
              <NarratorAvatar variant="bubble" state="speaking" />
            </div>
            <div className="kd-chat__bubble-content">
              <div className="kd-chat__typing">
                <span />
                <span />
                <span />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="kd-chat__actions">
        <button
          type="button"
          className="kd-chat__action-btn"
          onClick={onPrev}
          disabled={currentStep <= 1}
        >
          ← Önceki Adım
        </button>
        <button
          type="button"
          className="kd-chat__action-btn kd-chat__action-btn--primary"
          onClick={onNext}
          disabled={primaryDisabled}
        >
          {primaryLabel}
        </button>
      </div>

      <div className="kd-chat__suggestions" aria-label="Örnek sorular">
        {(suggestions?.length
          ? suggestions
          : RECIPE_CHAT_DEFAULT_SUGGESTIONS
        ).map((label) => (
          <button
            key={label}
            type="button"
            className="kd-chat__chip"
            onClick={() => onSend(label)}
          >
            {label}
          </button>
        ))}
      </div>

      <form className="kd-chat__input-bar" onSubmit={handleSubmit}>
        <input
          ref={inputRef}
          className="kd-chat__input"
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Soru sorun veya mesaj yazın…"
          autoComplete="off"
        />
        <button
          type="submit"
          className="kd-chat__send-btn"
          disabled={!draft.trim()}
          aria-label="Gönder"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 2L11 13" />
            <path d="M22 2L15 22L11 13L2 9L22 2Z" />
          </svg>
        </button>
      </form>
      <ChatKvkkNotice className="kd-chat__kvkk" />
    </div>
  );
}

function MessageContent({ text }: { text: string }) {
  const lines = text.split("\n");

  return (
    <div className="kd-msg-content">
      {lines.map((line, i) => {
        if (!line.trim()) return <br key={i} />;

        if (line.startsWith("• ") || line.startsWith("- ")) {
          return (
            <div className="kd-msg-bullet" key={i}>
              <span className="kd-msg-bullet-dot">•</span>
              <span>{renderInline(line.slice(2))}</span>
            </div>
          );
        }

        return (
          <p className="kd-msg-para" key={i}>
            {renderInline(line)}
          </p>
        );
      })}
    </div>
  );
}

function renderInline(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*(.+?)\*\*)|(_(.+?)_)/g;
  let lastIdx = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIdx) {
      parts.push(text.slice(lastIdx, match.index));
    }
    if (match[2]) {
      parts.push(<strong key={match.index}>{match[2]}</strong>);
    } else if (match[4]) {
      parts.push(<em key={match.index}>{match[4]}</em>);
    }
    lastIdx = regex.lastIndex;
  }

  if (lastIdx < text.length) {
    parts.push(text.slice(lastIdx));
  }

  return parts.length > 0 ? parts : [text];
}
