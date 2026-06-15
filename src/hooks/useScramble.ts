import { useEffect, useState } from "react";

const SCRAMBLE_CHARS = "ABCDEFGHJKLMNPRSTUVXYZ0123456789";

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export function useScramble(text: string, duration = 900) {
  const [reducedMotion, setReducedMotion] = useState(prefersReducedMotion);
  const [output, setOutput] = useState(text);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReducedMotion(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (reducedMotion) {
      setOutput(text);
      return;
    }

    setOutput(text.split("").map((c) => (c === " " || c === "'" ? c : SCRAMBLE_CHARS[0])).join(""));

    let raf = 0;
    const start = performance.now();
    const chars = text.split("");

    const frame = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      const settled = Math.floor(progress * chars.length);

      setOutput(
        chars
          .map((char, index) => {
            if (char === " " || char === "'" || index < settled) return char;
            const charIndex = Math.floor(Math.random() * SCRAMBLE_CHARS.length);
            return SCRAMBLE_CHARS[charIndex];
          })
          .join(""),
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
