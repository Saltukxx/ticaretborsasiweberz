import { useEffect, useMemo, useState } from "react";
import Sparkline from "./Sparkline";
import { useCountUp } from "../hooks/useReveal";
import "./HeroMosaic.css";

type CellTone = "green" | "gold" | "blue" | "red";

interface MosaicVariant {
  eyebrow: string;
  title: string;
  value: string;
  detail: string;
  change?: string;
  tone: CellTone;
  series?: number[];
  wide?: boolean;
  compass?: boolean;
  countUp?: number;
}

const mosaicCells: MosaicVariant[][] = [
  [
    {
      eyebrow: "Endeks",
      title: "Hububat Endeksi",
      value: "1.284,5",
      detail: "Son 30 gün ortalaması",
      change: "▲ 0,72%",
      tone: "green",
      series: [10.4, 10.9, 11.1, 10.8, 11.4, 11.6, 11.2, 11.7, 12, 11.8, 12.1, 12.3, 12, 12.4, 12.18],
      wide: true,
    },
    {
      eyebrow: "Endeks",
      title: "Tescilli Piyasa",
      value: "1.291,8",
      detail: "Anlık ağırlıklı sepet",
      change: "▲ 0,84%",
      tone: "green",
      series: [11.1, 11.3, 11.2, 11.7, 11.8, 12.0, 11.9, 12.2, 12.4, 12.3, 12.7, 12.5, 12.8, 12.9],
      wide: true,
    },
  ],
  [
    {
      eyebrow: "Buğday",
      title: "Ortalama",
      value: "12,84 ₺",
      detail: "En yüksek 13,42 ₺",
      change: "▲ 1,8%",
      tone: "green",
    },
    {
      eyebrow: "Buğday",
      title: "Hacim",
      value: "284,5 t",
      detail: "Bugünkü işlem",
      change: "▲ 4,2%",
      tone: "green",
    },
  ],
  [
    {
      eyebrow: "Arpa",
      title: "Ortalama",
      value: "9,65 ₺",
      detail: "En düşük 9,10 ₺",
      change: "▼ 0,6%",
      tone: "red",
    },
    {
      eyebrow: "Arpa",
      title: "Aralık",
      value: "9,10–10,05",
      detail: "Günlük bant",
      change: "Yatay",
      tone: "gold",
    },
  ],
  [
    {
      eyebrow: "Yerel Saat",
      title: "Erzurum",
      value: "CANLI_SAAT",
      detail: "Piyasa akışı açık",
      tone: "blue",
    },
  ],
  [
    {
      eyebrow: "Hacim",
      title: "Günlük İşlem",
      value: "284,5 t",
      detail: "Hububat + bakliyat",
      change: "▲ 6,1%",
      tone: "green",
    },
    {
      eyebrow: "Hacim",
      title: "Tescil Sayısı",
      value: "1.026",
      detail: "Bugün açılan kayıt",
      change: "Canlı",
      tone: "blue",
    },
  ],
  [
    {
      eyebrow: "Üye",
      title: "Aktif Üye",
      value: "1.842",
      detail: "Üretici · tüccar · sanayici",
      tone: "gold",
      countUp: 1842,
    },
  ],
  [
    {
      eyebrow: "Kur",
      title: "USD/TRY",
      value: "32,7180",
      detail: "Referans gösterge",
      change: "▲ 0,18%",
      tone: "green",
    },
    {
      eyebrow: "Kur",
      title: "EUR/TRY",
      value: "35,4920",
      detail: "Referans gösterge",
      change: "▲ 0,24%",
      tone: "green",
    },
  ],
  [
    {
      eyebrow: "Konum",
      title: "Erzurum",
      value: "39°54′ N",
      detail: "Rakım 2.060 m",
      tone: "gold",
      compass: true,
    },
  ],
];

function CountUpValue({ target, fallback }: { target: number; fallback: string }) {
  const ref = useCountUp(target, 1400, true);
  return <span ref={ref}>{fallback}</span>;
}

function MosaicCell({
  cell,
  index,
  flipKey,
  currentTime,
}: {
  cell: MosaicVariant;
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

        {cell.series && (
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
  const reducedMotion = useMemo(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    []
  );
  const [flipKeys, setFlipKeys] = useState(() => Array(mosaicCells.length).fill(0) as number[]);
  const [variants, setVariants] = useState(() => Array(mosaicCells.length).fill(0) as number[]);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const clock = window.setInterval(() => setNow(new Date()), 60000);
    return () => window.clearInterval(clock);
  }, []);

  useEffect(() => {
    if (reducedMotion) return;

    const id = window.setInterval(() => {
      const index = Math.floor(Math.random() * mosaicCells.length);
      setFlipKeys((keys) => keys.map((key, i) => (i === index ? key + 1 : key)));
      setVariants((items) =>
        items.map((item, i) => (i === index ? (item + 1) % mosaicCells[i].length : item))
      );
    }, 4800);

    return () => window.clearInterval(id);
  }, [reducedMotion]);

  const time = now.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="hmosaic" aria-label="Canlı piyasa mozaiği">
      <div className="hmosaic__topline">
        <span className="hmosaic__live-dot" data-pulsable />
        <span className="mono">Canlı Ticker Mozaiği · Tescilli Akış</span>
      </div>
      <div className="hmosaic__grid">
        {mosaicCells.map((variantsForCell, index) => (
          <MosaicCell
            key={index}
            index={index}
            flipKey={flipKeys[index]}
            currentTime={time}
            cell={variantsForCell[variants[index]]}
          />
        ))}
      </div>
    </div>
  );
}
