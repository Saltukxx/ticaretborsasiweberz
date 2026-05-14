import { useEffect, useMemo, useState } from "react";

export function useIdle(delay = 6000) {
  const reducedMotion = useMemo(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    []
  );
  const [idle, setIdle] = useState(false);

  useEffect(() => {
    if (reducedMotion) return;

    let timer = window.setTimeout(() => setIdle(true), delay);

    const reset = () => {
      setIdle(false);
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setIdle(true), delay);
    };

    window.addEventListener("pointermove", reset, { passive: true });
    window.addEventListener("scroll", reset, { passive: true });
    window.addEventListener("keydown", reset);
    window.addEventListener("touchstart", reset, { passive: true });

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("pointermove", reset);
      window.removeEventListener("scroll", reset);
      window.removeEventListener("keydown", reset);
      window.removeEventListener("touchstart", reset);
    };
  }, [delay, reducedMotion]);

  return idle;
}
