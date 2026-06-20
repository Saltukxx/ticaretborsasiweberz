import { useEffect } from "react";

/** Sets --vvh on documentElement from visualViewport (iOS keyboard / dynamic toolbar). */
export function useVisualViewport(enabled: boolean): void {
  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;

    const vv = window.visualViewport;
    if (!vv) return;

    const sync = () => {
      document.documentElement.style.setProperty("--vvh", `${vv.height}px`);
    };

    sync();
    vv.addEventListener("resize", sync);
    vv.addEventListener("scroll", sync);
    return () => {
      vv.removeEventListener("resize", sync);
      vv.removeEventListener("scroll", sync);
      document.documentElement.style.removeProperty("--vvh");
    };
  }, [enabled]);
}
