import { useCallback, useEffect, useRef } from "react";

export function useReveal<T extends HTMLElement = HTMLDivElement>(
  options: IntersectionObserverInit = { threshold: 0.18, rootMargin: "0px 0px -10% 0px" }
) {
  const ref = useRef<T | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      el.classList.add("is-visible");
      return;
    }
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            obs.unobserve(entry.target);
          }
        });
      },
      options
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return ref;
}

/**
 * Callback-ref tabanlı reveal: eleman veri yüklendikten sonra (geç) mount
 * olsa bile observer doğru anda bağlanır. Koşullu render edilen
 * reveal-stagger konteynerlerinde bunu kullanın.
 */
export function useRevealCallback<T extends HTMLElement = HTMLDivElement>(
  options: IntersectionObserverInit = { threshold: 0.18, rootMargin: "0px 0px -10% 0px" }
) {
  const obsRef = useRef<IntersectionObserver | null>(null);
  useEffect(() => () => obsRef.current?.disconnect(), []);
  return useCallback((el: T | null) => {
    obsRef.current?.disconnect();
    obsRef.current = null;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      el.classList.add("is-visible");
      return;
    }
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            obs.unobserve(entry.target);
          }
        });
      },
      options
    );
    obs.observe(el);
    obsRef.current = obs;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

export function useCountUp(target: number, duration = 1800, start = false) {
  const ref = useRef<HTMLSpanElement | null>(null);
  useEffect(() => {
    if (!start || !ref.current) return;
    const el = ref.current;
    const startTime = performance.now();
    const from = 0;
    let raf = 0;
    const step = (now: number) => {
      const t = Math.min(1, (now - startTime) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const val = from + (target - from) * eased;
      el.textContent = formatTR(val, target);
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, start]);
  return ref;
}

function formatTR(val: number, target: number) {
  const decimals = Number.isInteger(target) ? 0 : 2;
  return val.toLocaleString("tr-TR", {
    maximumFractionDigits: decimals,
    minimumFractionDigits: decimals,
  });
}
