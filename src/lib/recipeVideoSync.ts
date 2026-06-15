import type { RecipeStep } from "../data/kadayif-dolmasi-recipe";

/** Videodaki saniyeye göre aktif adım (0 = henüz başlamadı). */
export function stepFromVideoTime(
  time: number,
  steps: RecipeStep[],
  duration: number,
): number {
  if (!Number.isFinite(time) || time < 0.5) return 0;

  const end = Number.isFinite(duration) && duration > 0 ? duration : Infinity;

  for (let i = steps.length - 1; i >= 0; i--) {
    const start = steps[i].videoTimestamp;
    const nextStart = steps[i + 1]?.videoTimestamp ?? end;
    if (time >= start - 0.2 && time < nextStart - 0.15) {
      return steps[i].id;
    }
  }

  if (time >= end - 0.5) return steps[steps.length - 1]?.id ?? 0;
  return 0;
}

export function timestampForStep(stepId: number, steps: RecipeStep[]): number {
  if (stepId < 1) return 0;
  return steps[stepId - 1]?.videoTimestamp ?? 0;
}

/** Adım segmentinin bitiş saniyesi (sonraki adım başlangıcı veya video süresi). */
export function stepEndTimestamp(
  stepId: number,
  steps: RecipeStep[],
  duration: number,
): number {
  if (stepId < 1) return 0;
  const next = steps[stepId]?.videoTimestamp;
  if (next != null) return next;
  return Number.isFinite(duration) && duration > 0 ? duration : Infinity;
}

export function formatVideoTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const total = Math.floor(seconds);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function videoProgressPercent(
  currentTime: number,
  duration: number,
): number {
  if (!Number.isFinite(duration) || duration <= 0) return 0;
  return Math.min(100, Math.max(0, (currentTime / duration) * 100));
}
