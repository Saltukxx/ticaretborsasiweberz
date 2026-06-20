import { useEffect, useState } from "react";

/** Returns true when the user has not scrolled for `idleMs` milliseconds. */
export function useScrollIdle(idleMs = 150): boolean {
  const [idle, setIdle] = useState(true);

  useEffect(() => {
    let timer = 0;

    const onScroll = () => {
      setIdle(false);
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setIdle(true), idleMs);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.clearTimeout(timer);
    };
  }, [idleMs]);

  return idle;
}
