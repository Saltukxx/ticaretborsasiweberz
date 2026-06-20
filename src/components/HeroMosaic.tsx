import { useEffect, useMemo, useState } from "react";
import Sparkline from "./Sparkline";
import { useCountUp } from "../hooks/useReveal";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { useScrollIdle } from "../hooks/useScrollIdle";
import {
  useCurrentPrices,
  usePriceBulletin,
  usePublicStats,
} from "../hooks/usePublicApi";
import {
  buildHeroMosaicCells,
  type MosaicCell,
} from "../lib/heroMosaicData";
import "./HeroMosaic.css";

const PLACEHOLDER_CELLS: MosaicCell[][] = Array.from({ length: 7 }, () => [
  {
    eyebrow: "—",
    title: "Yükleniyor",
    value: "—",
    detail: "Veri bekleniyor",
    tone: "blue" as const,
  },
]);

function CountUpValue({ target, fallback }: { target: number; fallback: string }) {
  const ref = useCountUp(target, 1400, true);
  return <span ref={ref}>{fallback}</span>;
}

function MosaicCellView({
  cell,
  index,
  flipKey,
  currentTime,
}: {
  cell: MosaicCell;
  index: number;
  flipKey: number;
  currentTime: string;
}) {
  const value = cell.value === "CANLI_SAAT" ? currentTime : cell.value;

  return (
    <article
      className={`hmosaic__cell hmosaic__cell--${cell.tone} ${cell.wide ? "hmosaic__cell--wide" : ""}`}
      aria-live="polite"
      data-pulsable
    >
      <div className="hmosaic__cell-inner" key={`${index}-${flipKey}`}>
        <div className="hmosaic__cell-top">
          <span className="hmosaic__eyebrow mono">{cell.eyebrow}</span>
          {cell.change && <span className="hmosaic__change mono">{cell.change}</span>}
        </div>

        <div className="hmosaic__cell-body">
          <span className="hmosaic__title">{cell.title}</span>
          <strong className="hmosaic__value tabular">
            {cell.countUp ? <CountUpValue target={cell.countUp} fallback={cell.value} /> : value}
          </strong>
          <span className="hmosaic__detail mono">{cell.detail}</span>
        </div>

        {cell.series && cell.series.length > 1 && (
          <div className="hmosaic__spark">
            <Sparkline
              data={cell.series}
              width={280}
              height={58}
              color="var(--c-green-300)"
              fillColor="rgba(127, 220, 160, 0.14)"
              strokeWidth={1.6}
            />
          </div>
        )}

        {cell.compass && (
          <div className="hmosaic__compass" aria-hidden>
            <span />
            <i />
          </div>
        )}
      </div>
    </article>
  );
}

export default function HeroMosaic() {
  const scrollIdle = useScrollIdle();
  const pricesQ = useCurrentPrices();
  const bulletinQ = usePriceBulletin(true);
  const statsQ = usePublicStats();

  const rawCells: MosaicCell[][] = useMemo(
    () =>
      buildHeroMosaicCells({
        prices: pricesQ.data ?? [],
        bulletin: bulletinQ.data ?? null,
        stats: statsQ.data ?? [],
      }),
    [pricesQ.data, bulletinQ.data, statsQ.data],
  );

  const mosaicCells = useDebouncedValue(rawCells, 300);
  const hasLiveData =
    (pricesQ.data?.length ?? 0) > 0 ||
    bulletinQ.data != null ||
    (statsQ.data?.length ?? 0) > 0;
  const isInitialLoad =
    !hasLiveData &&
    (pricesQ.isLoading || bulletinQ.isLoading || statsQ.isLoading);
  const displayCells = isInitialLoad ? PLACEHOLDER_CELLS : mosaicCells;

  const reducedMotion = useMemo(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    [],
  );
  const [flipKeys, setFlipKeys] = useState<number[]>([]);
  const [variants, setVariants] = useState<number[]>([]);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    setFlipKeys(Array(displayCells.length).fill(0));
    setVariants(Array(displayCells.length).fill(0));
  }, [displayCells.length]);

  useEffect(() => {
    const clock = window.setInterval(() => setNow(new Date()), 60000);
    return () => window.clearInterval(clock);
  }, []);

  useEffect(() => {
    if (reducedMotion || displayCells.length === 0 || !scrollIdle || isInitialLoad) return;

    const id = window.setInterval(() => {
      const index = Math.floor(Math.random() * displayCells.length);
      setFlipKeys((keys) => keys.map((key, i) => (i === index ? key + 1 : key)));
      setVariants((items) =>
        items.map((item, i) => {
          const variantsForCell = displayCells[i]?.length ?? 1;
          if (variantsForCell <= 1) return 0;
          return i === index ? (item + 1) % variantsForCell : item;
        }),
      );
    }, 4800);

    return () => window.clearInterval(id);
  }, [reducedMotion, displayCells, scrollIdle, isInitialLoad]);

  const time = now.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="hmosaic" aria-label="Güncel piyasa özeti">
      <div className="hmosaic__grid">
        {displayCells.map((variantsForCell, index) => (
          <MosaicCellView
            key={index}
            index={index}
            flipKey={flipKeys[index] ?? 0}
            currentTime={time}
            cell={variantsForCell[variants[index] ?? 0] ?? variantsForCell[0]!}
          />
        ))}
      </div>
    </div>
  );
}
