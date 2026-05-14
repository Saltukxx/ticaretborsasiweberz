import { useEffect, useState } from "react";
import { stats } from "../data/market";
import { useReveal } from "../hooks/useReveal";
import "./QuickStats.css";

export default function QuickStats() {
  const ref = useReveal<HTMLDivElement>();
  const [active, setActive] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(true);
        });
      },
      { threshold: 0.3 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [ref]);

  return (
    <section className="qstats">
      <div className="container">
        <div className="qstats__head reveal" ref={useReveal<HTMLDivElement>()}>
          <span className="eyebrow">Güven Göstergeleri · 2026</span>
          <h2>
            Kurumu rakamlarla okuyun;<br />
            <em className="qstats__head-em">veriler bölgenin ekonomik nabzıdır.</em>
          </h2>
        </div>

        <div className="qstats__grid reveal-stagger" ref={ref}>
          {stats.map((s, i) => (
            <article className="qstat card" key={s.label}>
              <span className="qstat__num mono">{String(i + 1).padStart(2, "0")}</span>
              <div className="qstat__body">
                <Counter value={s.value} suffix={s.suffix} start={active} />
                <h3 className="qstat__label">{s.label}</h3>
                <p className="qstat__note mono">{s.note}</p>
              </div>
              <span className="qstat__line" />
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function Counter({ value, suffix, start }: { value: number; suffix: string; start: boolean }) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    if (!start) return;
    let raf = 0;
    const t0 = performance.now();
    const dur = 1800;
    const step = (t: number) => {
      const p = Math.min(1, (t - t0) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setShown(value * eased);
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value, start]);
  const decimals = Number.isInteger(value) ? 0 : 1;
  return (
    <strong className="qstat__value tabular">
      {shown.toLocaleString("tr-TR", { maximumFractionDigits: decimals, minimumFractionDigits: decimals })}
      <span>{suffix}</span>
    </strong>
  );
}
