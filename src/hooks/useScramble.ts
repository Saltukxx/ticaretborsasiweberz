import { useEffect, useMemo, useState } from "react";

const SCRAMBLE_CHARS = "ABCÇDEFGĞHIİJKLMNOÖPRSŞTUÜVYZ0123456789";

export function useScramble(text: string, duration = 900) {
  const reducedMotion = useMemo(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    []
  );
  const [output, setOutput] = useState(text);

  useEffect(() => {
    if (reducedMotion) {
      setOutput(text);
      return;
    }

    let raf = 0;
    const start = performance.now();
    const chars = text.split("");

    const frame = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      const settled = Math.floor(progress * chars.length);

      setOutput(
        chars
          .map((char, index) => {
            if (char === " " || index < settled) return char;
            const charIndex = Math.floor(Math.random() * SCRAMBLE_CHARS.length);
            return SCRAMBLE_CHARS[charIndex];
          })
          .join("")
      );

      if (progress < 1) {
        raf = requestAnimationFrame(frame);
      } else {
        setOutput(text);
      }
    };

    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [duration, reducedMotion, text]);

  return output;
}
