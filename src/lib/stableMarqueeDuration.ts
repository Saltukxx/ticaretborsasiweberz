import { useMemo } from "react";
import { marqueeDuration, marqueeHalfLength } from "./marqueeLoop";

type MarqueeVariant = "agenda" | "market";

/** Duration updates only when loop half-length changes — avoids animation reset on refetch. */
export function useStableMarqueeDuration(
  loop: unknown[],
  variant: MarqueeVariant,
): number | undefined {
  const halfLen = loop.length > 0 ? marqueeHalfLength(loop) : 0;

  return useMemo(() => {
    if (halfLen === 0) return undefined;
    return marqueeDuration(halfLen, variant);
  }, [halfLen, variant]);
}
