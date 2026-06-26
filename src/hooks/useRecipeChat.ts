import { useState, useCallback, useRef, useEffect, type RefObject } from "react";
import { flushSync } from "react-dom";
import { useSearchParams } from "react-router-dom";
import {
  kadayifDolmasiRecipe,
  type RecipeStep,
} from "../data/kadayif-dolmasi-recipe";
import { getChatSessionId } from "../lib/chatSessionId";
import {
  postRecipeChat,
  RecipeChatApiError,
  sanitizeRecipeReply,
  type RecipeChatHistoryTurn,
  type RecipeChatErrorCode,
} from "../lib/recipeChatApi";
import {
  stepFromVideoTime,
  stepEndTimestamp,
  timestampForStep,
} from "../lib/recipeVideoSync";
import {
  answerRecipeQuestion,
  narrateStepForFallback,
  recipeChatFallbackAnswer,
} from "../lib/recipeChatFallback";
import {
  extractVideoCommands,
  parseLocalVideoIntent,
  videoCommandAck,
  type VideoCommand,
  type RecipeVideoState,
} from "../lib/recipeVideoControl";

const GEMINI_HISTORY_MAX_TURNS = 8;
const STORAGE_KEY = "etb:recipe:kadayif-dolmasi:step";
const MESSAGES_STORAGE_KEY = "etb:recipe:kadayif-dolmasi:messages";
const VIDEO_TIME_STORAGE_KEY = "etb:recipe:kadayif-dolmasi:video-time";
const MESSAGES_STORAGE_MAX = 50;
const SEEK_GUARD_MS = 450;
const SEGMENT_END_BUFFER = 0.15;
const VIDEO_TIME_DEBOUNCE_MS = 500;

export type RecipeChatReplyMode = "live" | "local";

function turkishRecipeChatFallbackIntro(code: RecipeChatErrorCode): string {
  switch (code) {
    case "network":
      return "_Canlı yanıt bağlanamadı; yerel rehberden yanıtlıyorum._\n\n";
    case "http":
    case "not_configured":
      return "_Yapay zekâ hizmeti geçici olarak yanıt vermedi; yerel rehberden yanıtlıyorum._\n\n";
    case "blocked":
      return "_Güvenlik denetimi yanıtı engelledi; yerel rehberden yanıtlıyorum._\n\n";
    case "empty":
      return "_Yanıt oluşturulamadı; yerel rehberden yanıtlıyorum._\n\n";
    default:
      return "_Bir sorun oluştu; yerel rehberden yanıtlıyorum._\n\n";
  }
}

export interface ChatMessage {
  id: string;
  role: "bot" | "user";
  content: string;
  timestamp: number;
  stepId?: number;
}

export interface VideoProgress {
  currentTime: number;
  duration: number;
}

export interface UseRecipeChatReturn {
  messages: ChatMessage[];
  currentStep: number;
  totalSteps: number;
  currentStepData: RecipeStep;
  isTyping: boolean;
  videoRef: RefObject<HTMLVideoElement | null>;
  videoProgress: VideoProgress;
  isVideoPlaying: boolean;
  awaitingContinue: boolean;
  sendMessage: (text: string) => void;
  goToStep: (step: number, options?: GoToStepOptions) => void;
  nextStep: () => void;
  prevStep: () => void;
  toggleVideoPlay: () => void;
  onVideoTimeUpdate: (currentTime: number, duration: number) => void;
  onVideoLoadedMetadata: (duration: number) => void;
  onVideoEnded: () => void;
  onVideoPlay: () => void;
  onVideoPause: () => void;
  onProgressSeek: (time: number) => void;
  replyMode: RecipeChatReplyMode;
  resetChat: () => void;
}

export type GoToStepOptions = {
  narrate?: boolean;
  /** Videoyu adım timestamp'ine seek et (varsayılan: true) */
  seekVideo?: boolean;
  /** Seek sonrası oynat */
  play?: boolean;
  /** timeupdate kaynaklı — seek tetikleme */
  fromVideo?: boolean;
};

function chatMessagesToApiHistory(messages: ChatMessage[]): RecipeChatHistoryTurn[] {
  const turns: RecipeChatHistoryTurn[] = [];
  let welcomeBotSkipped = false;
  for (const m of messages) {
    if (m.role === "bot" && m.stepId !== undefined) continue;
    if (m.role === "bot" && !welcomeBotSkipped) {
      welcomeBotSkipped = true;
      continue;
    }
    turns.push({
      role: m.role === "user" ? "user" : "model",
      text: m.content,
    });
  }
  return turns.slice(-GEMINI_HISTORY_MAX_TURNS);
}

const recipe = kadayifDolmasiRecipe;

let _msgId = 0;
function makeId(): string {
  return `msg-${Date.now()}-${++_msgId}`;
}

function botMsg(content: string, stepId?: number): ChatMessage {
  return { id: makeId(), role: "bot", content, timestamp: Date.now(), stepId };
}

function userMsg(content: string): ChatMessage {
  return { id: makeId(), role: "user", content, timestamp: Date.now() };
}

function parseAdimParam(raw: string | null, totalSteps: number): number | null {
  if (!raw) return null;
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 1 || n > totalSteps) return null;
  return n;
}

function readStoredStep(totalSteps: number): number | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return parseAdimParam(raw, totalSteps);
  } catch {
    return null;
  }
}

function readStoredMessages(): ChatMessage[] | null {
  try {
    const raw = sessionStorage.getItem(MESSAGES_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed) || parsed.length === 0) return null;
    const valid = parsed.every(
      (m) =>
        m &&
        typeof m === "object" &&
        typeof m.id === "string" &&
        (m.role === "bot" || m.role === "user") &&
        typeof m.content === "string" &&
        typeof m.timestamp === "number",
    );
    if (!valid) return null;
    return parsed as ChatMessage[];
  } catch {
    return null;
  }
}

function persistMessages(messages: ChatMessage[]): void {
  try {
    const trimmed = messages.slice(-MESSAGES_STORAGE_MAX);
    sessionStorage.setItem(MESSAGES_STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    /* private mode / quota */
  }
}

function readStoredVideoTime(): number | null {
  try {
    const raw = sessionStorage.getItem(VIDEO_TIME_STORAGE_KEY);
    if (!raw) return null;
    const n = Number.parseFloat(raw);
    return Number.isFinite(n) && n >= 0 ? n : null;
  } catch {
    return null;
  }
}

function persistVideoTime(time: number): void {
  try {
    sessionStorage.setItem(VIDEO_TIME_STORAGE_KEY, String(time));
  } catch {
    /* private mode / quota */
  }
}

function narrateStep(step: RecipeStep): string {
  return narrateStepForFallback(step);
}

function welcomeMessage(): string {
  return (
    `**Hoş geldiniz!**\n\n` +
    `Ben Erzurum Ticaret Borsası'nın kültürel anlatıcısıyım. **Kadayıfçı Harun Usta** atölye videosu eşliğinde Erzurum'un tescilli tatlısı **Kadayıf Dolması**'nın yapılışını adım adım izleyeceksiniz.\n\n` +
    `${recipe.culturalContext}\n\n` +
    `**"Tarife Başla"** deyin veya videodaki oynat düğmesine basın. Her adım sonunda video durur; devam etmek için **Sonraki Adım** veya **Devam Et**'e basın.\n\n` +
    `Videoyu sohbetten de yönetebilirsiniz: _"videoyu durdur"_, _"kızartma adımına git"_, _"10 saniye ileri sar"_ gibi istekler verebilirsiniz.`
  );
}

export function useRecipeChat(): UseRecipeChatReturn {
  const [searchParams, setSearchParams] = useSearchParams();
  const restoredMessages = useRef(readStoredMessages());
  const [messages, setMessages] = useState<ChatMessage[]>(
    () => restoredMessages.current ?? [],
  );
  const [currentStep, setCurrentStep] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [videoProgress, setVideoProgress] = useState<VideoProgress>({
    currentTime: 0,
    duration: 0,
  });
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [awaitingContinue, setAwaitingContinue] = useState(false);
  const [replyMode, setReplyMode] = useState<RecipeChatReplyMode>("live");

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hasInit = useRef(false);
  const initialStepAppliedRef = useRef(false);
  const lastNarratedStepRef = useRef(0);
  const completionAnnouncedRef = useRef(false);
  const chatAbortRef = useRef<AbortController | null>(null);
  const sessionIdRef = useRef(getChatSessionId("recipe"));
  const currentStepRef = useRef(0);
  const isProgrammaticSeekRef = useRef(false);
  const seekGuardTimerRef = useRef<number | null>(null);
  const userInteractedRef = useRef(false);
  const videoProgressRef = useRef(videoProgress);
  const isVideoPlayingRef = useRef(isVideoPlaying);
  const awaitingContinueRef = useRef(awaitingContinue);
  const videoTimeRestoredRef = useRef(false);
  const videoTimeDebounceRef = useRef<number | null>(null);

  videoProgressRef.current = videoProgress;
  isVideoPlayingRef.current = isVideoPlaying;
  awaitingContinueRef.current = awaitingContinue;

  const getVideoState = useCallback((): RecipeVideoState => ({
    currentStep: currentStepRef.current,
    currentTime: videoProgressRef.current.currentTime,
    duration: videoProgressRef.current.duration,
    isPlaying: isVideoPlayingRef.current,
    awaitingContinue: awaitingContinueRef.current,
  }), []);

  const totalSteps = recipe.steps.length;
  const currentStepData =
    recipe.steps[Math.max(0, Math.min(currentStep - 1, totalSteps - 1))];

  currentStepRef.current = currentStep;

  const beginSeekGuard = useCallback(() => {
    isProgrammaticSeekRef.current = true;
    if (seekGuardTimerRef.current != null) {
      window.clearTimeout(seekGuardTimerRef.current);
    }
    seekGuardTimerRef.current = window.setTimeout(() => {
      isProgrammaticSeekRef.current = false;
      seekGuardTimerRef.current = null;
    }, SEEK_GUARD_MS);
  }, []);

  const seekVideoToStep = useCallback(
    (step: number, play: boolean) => {
      const video = videoRef.current;
      if (!video) return;
      const target = timestampForStep(step, recipe.steps);
      beginSeekGuard();
      if (Math.abs(video.currentTime - target) > 0.25) {
        video.currentTime = target;
      }
      if (play) {
        video.muted = false;
        setAwaitingContinue(false);
        void video.play().catch(() => {
          /* autoplay policy */
        });
      } else {
        video.pause();
      }
    },
    [beginSeekGuard],
  );

  const pauseAtSegmentEnd = useCallback(
    (currentTime: number, duration: number) => {
      const video = videoRef.current;
      const step = currentStepRef.current;
      if (!video || step < 1) return;

      const end = stepEndTimestamp(step, recipe.steps, duration);
      if (currentTime < end - SEGMENT_END_BUFFER) return;

      beginSeekGuard();
      video.currentTime = Math.max(timestampForStep(step, recipe.steps), end - 0.05);
      video.pause();
      setAwaitingContinue(true);
      setIsVideoPlaying(false);
    },
    [beginSeekGuard],
  );

  useEffect(() => {
    return () => {
      chatAbortRef.current?.abort();
      chatAbortRef.current = null;
      if (seekGuardTimerRef.current != null) {
        window.clearTimeout(seekGuardTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (messages.length === 0) return;
    persistMessages(messages);
  }, [messages]);

  const addBotMessage = useCallback(
    (content: string, stepId?: number, instant = false) => {
      if (instant) {
        setMessages((prev) => [...prev, botMsg(content, stepId)]);
        return;
      }
      setIsTyping(true);
      const delay = Math.min(800 + content.length * 4, 2500);
      setTimeout(() => {
        setMessages((prev) => [...prev, botMsg(content, stepId)]);
        setIsTyping(false);
      }, delay);
    },
    [],
  );

  const goToStep = useCallback(
    (step: number, options?: GoToStepOptions) => {
      if (step < 1 || step > totalSteps) return;

      const {
        narrate = true,
        seekVideo = true,
        play = false,
        fromVideo = false,
      } = options ?? {};

      const prevStep = currentStepRef.current;

      if (step < totalSteps) completionAnnouncedRef.current = false;
      setCurrentStep(step);
      currentStepRef.current = step;

      if (step < prevStep) {
        lastNarratedStepRef.current = Math.min(lastNarratedStepRef.current, step - 1);
      }

      if (narrate && lastNarratedStepRef.current !== step) {
        lastNarratedStepRef.current = step;
        const stepData = recipe.steps[step - 1];
        addBotMessage(narrateStep(stepData), step);
      }

      if (!fromVideo && seekVideo) {
        seekVideoToStep(step, play);
        if (!play) setAwaitingContinue(false);
      }
    },
    [totalSteps, addBotMessage, seekVideoToStep],
  );

  const announceCompletion = useCallback(() => {
    if (completionAnnouncedRef.current) return;
    completionAnnouncedRef.current = true;
    addBotMessage(
      `**Tebrikler!**\n\nKadayıf dolmasının yapılışını başarıyla tamamladınız. Erzurum'un bu eşsiz tatlı mirasını artık kendi mutfağınızda deneyebilirsiniz.\n\nSorunuz varsa sormaya devam edebilirsiniz. Afiyet olsun!`,
    );
  }, [addBotMessage]);

  const onVideoTimeUpdate = useCallback(
    (currentTime: number, duration: number) => {
      setVideoProgress({ currentTime, duration });

      if (videoTimeDebounceRef.current != null) {
        window.clearTimeout(videoTimeDebounceRef.current);
      }
      videoTimeDebounceRef.current = window.setTimeout(() => {
        persistVideoTime(currentTime);
      }, VIDEO_TIME_DEBOUNCE_MS);

      if (isProgrammaticSeekRef.current) return;

      const video = videoRef.current;
      const playing = video ? !video.paused : false;

      if (playing && currentStepRef.current > 0) {
        pauseAtSegmentEnd(currentTime, duration);
      }
    },
    [pauseAtSegmentEnd],
  );

  const onVideoLoadedMetadata = useCallback((duration: number) => {
    setVideoProgress((prev) => ({ ...prev, duration }));

    if (videoTimeRestoredRef.current) return;
    videoTimeRestoredRef.current = true;

    const stored = readStoredVideoTime();
    const video = videoRef.current;
    if (stored == null || !video || duration <= 0) return;
    if (stored >= duration) return;

    beginSeekGuard();
    video.currentTime = stored;
    setVideoProgress((prev) => ({ ...prev, currentTime: stored }));
  }, [beginSeekGuard]);

  const onVideoEnded = useCallback(() => {
    setIsVideoPlaying(false);
    setAwaitingContinue(true);
    if (currentStepRef.current < totalSteps) {
      goToStep(totalSteps, { fromVideo: true, narrate: false, seekVideo: false });
    }
    announceCompletion();
  }, [goToStep, totalSteps, announceCompletion]);

  const onVideoPlay = useCallback(() => {
    setIsVideoPlaying(true);
    userInteractedRef.current = true;
    const video = videoRef.current;
    if (video) video.muted = false;
    if (currentStepRef.current === 0) {
      goToStep(1, { narrate: true, play: true, seekVideo: true });
    }
  }, [goToStep]);

  const onVideoPause = useCallback(() => {
    setIsVideoPlaying(false);
  }, []);

  const onProgressSeek = useCallback(
    (time: number) => {
      const video = videoRef.current;
      if (!video) return;

      const duration = video.duration || videoProgress.duration;
      const clamped = Math.max(0, Math.min(time, duration || time));

      beginSeekGuard();
      video.currentTime = clamped;
      video.pause();
      setVideoProgress((prev) => ({ ...prev, currentTime: clamped }));
      setAwaitingContinue(false);
      setIsVideoPlaying(false);

      const detected = stepFromVideoTime(clamped, recipe.steps, duration);
      if (detected > 0) {
        goToStep(detected, { fromVideo: true, narrate: true, seekVideo: false });
      } else if (currentStepRef.current > 0) {
        setCurrentStep(0);
        currentStepRef.current = 0;
        lastNarratedStepRef.current = 0;
      }

      userInteractedRef.current = true;
      video.muted = false;
    },
    [beginSeekGuard, goToStep, videoProgress.duration],
  );

  const nextStep = useCallback(() => {
    if (awaitingContinue && currentStep >= totalSteps) {
      announceCompletion();
      return;
    }
    const next = currentStep === 0 ? 1 : currentStep + 1;
    if (next > totalSteps) {
      announceCompletion();
      return;
    }
    setAwaitingContinue(false);
    goToStep(next, { narrate: true, seekVideo: true, play: true });
  }, [currentStep, totalSteps, goToStep, announceCompletion, awaitingContinue]);

  const prevStep = useCallback(() => {
    if (currentStep <= 1) return;
    setAwaitingContinue(false);
    goToStep(currentStep - 1, { narrate: true, seekVideo: true, play: true });
  }, [currentStep, goToStep]);

  const toggleVideoPlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    userInteractedRef.current = true;
    video.muted = false;

    if (awaitingContinue) {
      nextStep();
      return;
    }

    if (video.paused) {
      if (currentStepRef.current === 0) {
        goToStep(1, { narrate: true, play: true, seekVideo: true });
        return;
      }
      void video.play();
    } else {
      video.pause();
    }
  }, [goToStep, awaitingContinue, nextStep]);

  const seekToTime = useCallback(
    (seconds: number, play: boolean) => {
      const video = videoRef.current;
      if (!video) return;
      const duration = video.duration || videoProgressRef.current.duration;
      const clamped = Math.max(0, Math.min(seconds, duration || seconds));

      beginSeekGuard();
      video.currentTime = clamped;
      setVideoProgress((prev) => ({ ...prev, currentTime: clamped }));

      const detected = stepFromVideoTime(clamped, recipe.steps, duration);
      if (detected > 0 && detected !== currentStepRef.current) {
        setCurrentStep(detected);
        currentStepRef.current = detected;
      } else if (detected === 0 && currentStepRef.current > 0) {
        setCurrentStep(0);
        currentStepRef.current = 0;
        lastNarratedStepRef.current = 0;
      }

      userInteractedRef.current = true;
      video.muted = false;

      if (play) {
        setAwaitingContinue(false);
        void video.play();
      } else {
        video.pause();
        setIsVideoPlaying(false);
        setAwaitingContinue(false);
      }
    },
    [beginSeekGuard],
  );

  const executeVideoCommand = useCallback(
    (cmd: VideoCommand) => {
      const video = videoRef.current;

      switch (cmd.action) {
        case "pause":
          video?.pause();
          setIsVideoPlaying(false);
          break;
        case "play":
          if (awaitingContinueRef.current) {
            nextStep();
            break;
          }
          if (currentStepRef.current === 0) {
            goToStep(1, { narrate: false, play: true, seekVideo: true });
          } else if (video) {
            video.muted = false;
            setAwaitingContinue(false);
            void video.play();
          }
          break;
        case "next_step":
          nextStep();
          break;
        case "prev_step":
          prevStep();
          break;
        case "step":
          if (cmd.step != null) {
            goToStep(cmd.step, {
              narrate: false,
              seekVideo: true,
              play: cmd.play ?? false,
            });
          }
          break;
        case "seek":
          if (cmd.seconds != null) {
            seekToTime(cmd.seconds, cmd.play ?? false);
          }
          break;
        case "delta": {
          const base = video?.currentTime ?? videoProgressRef.current.currentTime;
          seekToTime(base + (cmd.delta ?? 0), false);
          break;
        }
      }
    },
    [goToStep, nextStep, prevStep, seekToTime],
  );

  const runVideoCommands = useCallback(
    (commands: VideoCommand[]) => {
      for (const cmd of commands) {
        executeVideoCommand(cmd);
      }
    },
    [executeVideoCommand],
  );

  useEffect(() => {
    if (hasInit.current) return;
    hasInit.current = true;
    if (restoredMessages.current?.length) return;
    addBotMessage(welcomeMessage());
  }, [addBotMessage]);

  useEffect(() => {
    if (!hasInit.current || initialStepAppliedRef.current) return;

    const urlStep = parseAdimParam(searchParams.get("adim"), totalSteps);
    const storedStep = urlStep ? null : readStoredStep(totalSteps);
    const target = urlStep ?? storedStep;

    if (!target) return;

    initialStepAppliedRef.current = true;
    const timer = window.setTimeout(() => {
      goToStep(target, { narrate: true, seekVideo: true, play: false });
    }, 400);

    return () => window.clearTimeout(timer);
  }, [searchParams, totalSteps, goToStep]);

  useEffect(() => {
    if (currentStep < 1) {
      const next = new URLSearchParams(searchParams);
      if (next.has("adim")) {
        next.delete("adim");
        setSearchParams(next, { replace: true });
      }
      return;
    }

    const next = new URLSearchParams(searchParams);
    const adim = String(currentStep);
    if (next.get("adim") !== adim) {
      next.set("adim", adim);
      setSearchParams(next, { replace: true });
    }

    const timer = window.setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, String(currentStep));
      } catch {
        /* private mode */
      }
    }, 300);

    return () => window.clearTimeout(timer);
  }, [currentStep, searchParams, setSearchParams]);

  const sendMessage = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;

      const lower = trimmed.toLocaleLowerCase("tr-TR");

      const appendUserToChat = () => {
        setMessages((prev) => [...prev, userMsg(trimmed)]);
      };

      if (
        lower === "başla" ||
        lower === "başlayalım" ||
        lower === "devam" ||
        lower === "sonraki" ||
        lower === "ileri" ||
        lower === "sonraki adım" ||
        lower === "devam et" ||
        lower === "next" ||
        lower === "tarife başla"
      ) {
        appendUserToChat();
        nextStep();
        return;
      }

      if (
        lower === "önceki" ||
        lower === "geri" ||
        lower === "önceki adım" ||
        lower === "geri dön"
      ) {
        appendUserToChat();
        prevStep();
        return;
      }

      let priorSnapshot: ChatMessage[] = [];
      flushSync(() => {
        setMessages((prev) => {
          priorSnapshot = prev.slice();
          return [...prev, userMsg(trimmed)];
        });
      });

      chatAbortRef.current?.abort();
      const controller = new AbortController();
      chatAbortRef.current = controller;

      setIsTyping(true);

      const botId = makeId();
      let streamStarted = false;
      let streamedText = "";

      void (async () => {
        const videoState = getVideoState();

        try {
          const reply = await postRecipeChat(
            trimmed,
            chatMessagesToApiHistory(priorSnapshot),
            controller.signal,
            currentStep,
            videoState,
            sessionIdRef.current,
            (delta) => {
              streamedText += delta;
              if (!streamStarted) {
                streamStarted = true;
                setMessages((prev) => [
                  ...prev,
                  { id: botId, role: "bot", content: streamedText, timestamp: Date.now() },
                ]);
                return;
              }
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === botId ? { ...m, content: streamedText } : m,
                ),
              );
            },
          );
          if (controller.signal.aborted) {
            if (streamStarted) {
              setMessages((prev) => prev.filter((m) => m.id !== botId));
            }
            return;
          }

          const finalReply = reply?.trim() ? reply : streamedText;
          const { cleanText, commands } = extractVideoCommands(finalReply);
          let cmds = commands;

          if (cmds.length === 0) {
            const localCmd = parseLocalVideoIntent(trimmed, recipe.steps, videoState);
            if (localCmd) cmds = [localCmd];
          }

          runVideoCommands(cmds);

          const sanitized = sanitizeRecipeReply(cleanText);
          const ack =
            cmds.length > 0
              ? cmds.map((c) => videoCommandAck(c, recipe.steps)).join(" ")
              : "";
          const body =
            sanitized || ack || "Tamam, isteğinizi yerine getirdim.";

          setReplyMode("live");
          if (streamStarted) {
            setMessages((prev) =>
              prev.map((m) => (m.id === botId ? { ...m, content: body } : m)),
            );
          } else {
            setMessages((prev) => [...prev, botMsg(body)]);
          }
        } catch (err) {
          if (
            controller.signal.aborted ||
            (err instanceof Error && err.name === "AbortError")
          ) {
            if (streamStarted) {
              setMessages((prev) => prev.filter((m) => m.id !== botId));
            }
            return;
          }
          setReplyMode("local");
          const intro =
            err instanceof RecipeChatApiError
              ? turkishRecipeChatFallbackIntro(err.code)
              : turkishRecipeChatFallbackIntro("unknown");

          const localCmd = parseLocalVideoIntent(trimmed, recipe.steps, getVideoState());
          if (localCmd) {
            runVideoCommands([localCmd]);
            addBotMessage(
              `${intro}${videoCommandAck(localCmd, recipe.steps)}`,
              undefined,
              true,
            );
            return;
          }

          const body =
            answerRecipeQuestion(trimmed, currentStep) ?? recipeChatFallbackAnswer();
          addBotMessage(`${intro}${body}`, undefined, true);
        } finally {
          if (!controller.signal.aborted) setIsTyping(false);
        }
      })();
    },
    [
      currentStep,
      nextStep,
      prevStep,
      addBotMessage,
      getVideoState,
      runVideoCommands,
    ],
  );

  const resetChat = useCallback(() => {
    chatAbortRef.current?.abort();
    setIsTyping(false);
    setReplyMode("live");
    try {
      sessionStorage.removeItem(MESSAGES_STORAGE_KEY);
    } catch {
      /* private mode */
    }
    setMessages([botMsg(welcomeMessage())]);
  }, []);

  return {
    messages,
    currentStep,
    totalSteps,
    currentStepData,
    isTyping,
    videoRef,
    videoProgress,
    isVideoPlaying,
    awaitingContinue,
    sendMessage,
    goToStep,
    nextStep,
    prevStep,
    toggleVideoPlay,
    onVideoTimeUpdate,
    onVideoLoadedMetadata,
    onVideoEnded,
    onVideoPlay,
    onVideoPause,
    onProgressSeek,
    replyMode,
    resetChat,
  };
}
