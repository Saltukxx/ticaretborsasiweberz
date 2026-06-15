import type { RecipeStep } from "../data/kadayif-dolmasi-recipe";
import { stepFromVideoTime } from "./recipeVideoSync";

export type VideoCommandAction =
  | "play"
  | "pause"
  | "seek"
  | "step"
  | "delta"
  | "next_step"
  | "prev_step";

export interface VideoCommand {
  action: VideoCommandAction;
  /** seek */
  seconds?: number;
  /** step (1–7) */
  step?: number;
  /** step / seek sonrası oynat */
  play?: boolean;
  /** delta — göreli saniye (+ ileri, − geri) */
  delta?: number;
}

export interface RecipeVideoState {
  currentStep: number;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  awaitingContinue: boolean;
}

const VIDEO_BLOCK_RE = /\[\[VIDEO:\s*(\{[\s\S]*?\})\s*\]\]/gi;

function clampTime(seconds: number, duration: number): number {
  if (!Number.isFinite(seconds) || seconds < 0) return 0;
  if (Number.isFinite(duration) && duration > 0) {
    return Math.min(seconds, duration);
  }
  return seconds;
}

function parseTimeToken(raw: string): number | null {
  const t = raw.trim();
  const colon = /^(\d+):(\d{1,2})$/;
  const m = colon.exec(t);
  if (m) {
    return Number.parseInt(m[1], 10) * 60 + Number.parseInt(m[2], 10);
  }
  const n = Number.parseFloat(t.replace(",", "."));
  return Number.isFinite(n) && n >= 0 ? n : null;
}

function normalizeCommand(raw: unknown): VideoCommand | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const action = o.action;
  if (typeof action !== "string") return null;

  switch (action) {
    case "play":
    case "pause":
    case "next_step":
    case "prev_step":
      return { action };
    case "seek": {
      const seconds =
        typeof o.seconds === "number"
          ? o.seconds
          : typeof o.time === "string"
            ? parseTimeToken(o.time)
            : null;
      if (seconds == null) return null;
      return {
        action: "seek",
        seconds,
        play: o.play === true,
      };
    }
    case "step": {
      const step =
        typeof o.step === "number"
          ? o.step
          : typeof o.stepId === "number"
            ? o.stepId
            : null;
      if (step == null || step < 1 || step > 7) return null;
      return {
        action: "step",
        step,
        play: o.play === true,
      };
    }
    case "delta": {
      const delta =
        typeof o.seconds === "number"
          ? o.seconds
          : typeof o.delta === "number"
            ? o.delta
            : null;
      if (delta == null || delta === 0) return null;
      return { action: "delta", delta };
    }
    default:
      return null;
  }
}

/** Gemini yanıtındaki [[VIDEO:{...}]] bloklarını ayırır. */
export function extractVideoCommands(text: string): {
  cleanText: string;
  commands: VideoCommand[];
} {
  const commands: VideoCommand[] = [];
  let cleanText = text;

  for (const match of text.matchAll(VIDEO_BLOCK_RE)) {
    try {
      const parsed = JSON.parse(match[1]) as unknown;
      const cmd = normalizeCommand(parsed);
      if (cmd) commands.push(cmd);
    } catch {
      /* geçersiz JSON */
    }
    cleanText = cleanText.replace(match[0], "");
  }

  cleanText = cleanText.replace(/\n{3,}/g, "\n\n").trim();
  return { cleanText, commands };
}

export function stripVideoControlBlocks(text: string): string {
  return extractVideoCommands(text).cleanText;
}

function findStepByTitle(steps: RecipeStep[], query: string): number | null {
  const q = query.toLocaleLowerCase("tr-TR").trim();
  if (!q) return null;
  const hit = steps.find((s) => {
    const title = s.title.toLocaleLowerCase("tr-TR");
    return title.includes(q) || q.includes(title.split(" ")[0] ?? "");
  });
  return hit?.id ?? null;
}

/** Yerel (offline) video niyeti — fallback ve hızlı komutlar. */
export function parseLocalVideoIntent(
  text: string,
  steps: RecipeStep[],
  state: RecipeVideoState,
): VideoCommand | null {
  const lower = text.toLocaleLowerCase("tr-TR").trim();

  if (
    /^(videoyu\s+)?(durdur|duraklat|pause|stop)\.?$/.test(lower) ||
    lower === "video dur" ||
    lower.includes("videoyu durdur")
  ) {
    return { action: "pause" };
  }

  if (
    /^(videoyu\s+)?(oynat|başlat|devam\s*et)\.?$/.test(lower) ||
    lower === "video oynat" ||
    lower.includes("videoyu oynat")
  ) {
    return { action: "play" };
  }

  if (
    lower.includes("sonraki adım") &&
    (lower.includes("video") || lower.includes("git") || lower.includes("geç"))
  ) {
    return { action: "next_step" };
  }

  if (
    lower.includes("önceki adım") &&
    (lower.includes("video") || lower.includes("git") || lower.includes("dön"))
  ) {
    return { action: "prev_step" };
  }

  const stepNum =
    /(?:adım|step)\s*[#:]?\s*(\d)/i.exec(text) ??
    /(\d)\.\s*adım/i.exec(text);
  if (stepNum) {
    const n = Number.parseInt(stepNum[1], 10);
    if (n >= 1 && n <= steps.length) {
      const play = /oynat|başlat|göster/.test(lower);
      return { action: "step", step: n, play };
    }
  }

  for (const step of steps) {
    const titleLower = step.title.toLocaleLowerCase("tr-TR");
    if (
      lower.includes(titleLower) &&
      (lower.includes("git") ||
        lower.includes("göster") ||
        lower.includes("al") ||
        lower.includes("getir") ||
        lower.includes("aç"))
    ) {
      return {
        action: "step",
        step: step.id,
        play: /oynat|başlat/.test(lower),
      };
    }
  }

  const deltaFwd =
    /(\d+)\s*saniye\s*ileri/i.exec(text) ??
    /ileri\s*(\d+)\s*saniye/i.exec(text) ??
    /(\d+)\s*s\s*ileri/i.exec(text);
  if (deltaFwd) {
    return { action: "delta", delta: Number.parseInt(deltaFwd[1], 10) };
  }

  const deltaBack =
    /(\d+)\s*saniye\s*geri/i.exec(text) ??
    /geri\s*(\d+)\s*saniye/i.exec(text) ??
    /(\d+)\s*s\s*geri/i.exec(text);
  if (deltaBack) {
    return { action: "delta", delta: -Number.parseInt(deltaBack[1], 10) };
  }

  if (/geri\s*(sar|al)|rewind|sardır/i.test(lower)) {
    return { action: "delta", delta: -10 };
  }

  if (/ileri\s*(sar|atla|git)|fast\s*forward/i.test(lower)) {
    return { action: "delta", delta: 10 };
  }

  const seekSec =
    /(\d{1,2}:\d{2})\s*(?:saniye|dk|dakika)?/i.exec(text) ??
    /(\d+(?:[.,]\d+)?)\s*\.?\s*saniyeye/i.exec(text) ??
    /(\d+(?:[.,]\d+)?)\s*saniye(?:ye|de|deki)/i.exec(text);
  if (seekSec && (lower.includes("git") || lower.includes("al") || lower.includes("getir") || lower.includes("konum"))) {
    const t = parseTimeToken(seekSec[1].replace(",", "."));
    if (t != null) {
      return { action: "seek", seconds: t, play: /oynat|başlat/.test(lower) };
    }
  }

  if (
    /başa\s*al|baştan|en\s*başa|videoyu\s*sıfırla|restart/i.test(lower)
  ) {
    return { action: "seek", seconds: 0, play: false };
  }

  if (/kaldığım\s*yer|devam\s*ettiğim/i.test(lower)) {
    return { action: "seek", seconds: state.currentTime, play: true };
  }

  return null;
}

export function videoCommandAck(
  cmd: VideoCommand,
  steps: RecipeStep[],
): string {
  switch (cmd.action) {
    case "pause":
      return "Videoyu durdurdum.";
    case "play":
      return "Videoyu oynatıyorum.";
    case "next_step":
      return "Sonraki adıma geçiyorum.";
    case "prev_step":
      return "Önceki adıma dönüyorum.";
    case "step": {
      const s = steps[(cmd.step ?? 1) - 1];
      return s
        ? `**Adım ${cmd.step} — ${s.title}** konumuna gittim${cmd.play ? " ve oynatıyorum" : ""}.`
        : "İlgili adıma gittim.";
    }
    case "seek":
      return `${formatAckTime(cmd.seconds ?? 0)} konumuna aldım${cmd.play ? " ve oynatıyorum" : ""}.`;
    case "delta":
      return cmd.delta && cmd.delta > 0
        ? `${cmd.delta} saniye ileri sardım.`
        : `${Math.abs(cmd.delta ?? 0)} saniye geri sardım.`;
    default:
      return "Videoyu ayarladım.";
  }
}

function formatAckTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function stepForSeekTime(
  time: number,
  steps: RecipeStep[],
  duration: number,
): number {
  return stepFromVideoTime(time, steps, duration);
}
