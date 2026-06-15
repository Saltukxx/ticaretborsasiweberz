/** Seconds for one half-loop; scales with content width (item count as proxy). */
export function marqueeDuration(
  halfLoopLength: number,
  variant: "agenda" | "market" = "agenda",
): number {
  if (variant === "market") {
    return Math.max(52, Math.min(110, halfLoopLength * 4.8));
  }
  return Math.max(22, Math.min(48, halfLoopLength * 3));
}

/** Seamless marquee: expand sparse lists, then duplicate for -50% scroll loop. */
export function marqueeLoop<T>(items: T[], minItems = 12): T[] {
  if (items.length === 0) return [];
  let batch = [...items];
  while (batch.length < minItems) {
    batch = [...batch, ...items];
  }
  return [...batch, ...batch];
}

export function marqueeHalfLength(loop: unknown[]): number {
  return Math.max(1, loop.length / 2);
}
