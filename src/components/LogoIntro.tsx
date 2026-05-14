import { CSSProperties, useEffect, useMemo, useState } from "react";
import "./LogoIntro.css";

interface Props {
  onDone: () => void;
}

function buildGearPath(
  cx: number,
  cy: number,
  outerR: number,
  innerR: number,
  holeR: number,
  teeth: number
): string {
  const step = (Math.PI * 2) / teeth;
  const toothHalf = step * 0.26;
  const tipHalf = toothHalf * 0.52;

  const pt = (angle: number, r: number) =>
    `${(cx + r * Math.cos(angle)).toFixed(2)} ${(cy + r * Math.sin(angle)).toFixed(2)}`;

  let d = "";
  for (let i = 0; i < teeth; i++) {
    const base = i * step - Math.PI / 2;
    const rootL = base - toothHalf;
    const tipL = base - tipHalf;
    const tipR = base + tipHalf;
    const rootR = base + toothHalf;

    d += i === 0 ? `M ${pt(rootL, innerR)}` : ` L ${pt(rootL, innerR)}`;
    d += ` L ${pt(tipL, outerR)} L ${pt(tipR, outerR)} L ${pt(rootR, innerR)}`;
  }
  d += " Z";

  // inner hole — counterclockwise so fill-rule:evenodd cuts it out
  const hx = (cx + holeR).toFixed(2);
  const hxn = (cx - holeR).toFixed(2);
  const hy = cy.toFixed(2);
  d += ` M ${hx} ${hy} A ${holeR} ${holeR} 0 1 0 ${hxn} ${hy}`;
  d += ` A ${holeR} ${holeR} 0 1 0 ${hx} ${hy} Z`;

  return d;
}

const networkNodes = [
  { id: "merkez", label: "Erzurum Merkez", x: 50, y: 51, center: true, delay: 0.65 },
  { id: "ispir", label: "İspir", x: 36, y: 24, delay: 0.95 },
  { id: "tortum", label: "Tortum", x: 48, y: 28, delay: 1.1 },
  { id: "oltu", label: "Oltu", x: 67, y: 27, delay: 1.25 },
  { id: "narman", label: "Narman", x: 75, y: 39, delay: 1.4 },
  { id: "horasan", label: "Horasan", x: 78, y: 52, delay: 1.55 },
  { id: "pasinler", label: "Pasinler", x: 64, y: 56, delay: 1.7 },
  { id: "askale", label: "Aşkale", x: 29, y: 58, delay: 1.85 },
  { id: "cat", label: "Çat", x: 42, y: 73, delay: 2 },
];

const centerNode = networkNodes[0];

export default function LogoIntro({ onDone }: Props) {
  const [phase, setPhase] = useState<"enter" | "network" | "logo" | "exit" | "gone">("enter");

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("network"), 900);
    const t2 = setTimeout(() => setPhase("logo"), 2600);
    const t3 = setTimeout(() => setPhase("exit"), 4700);
    const t4 = setTimeout(() => {
      setPhase("gone");
      onDone();
    }, 5800);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [onDone]);

  // 20-tooth gear: outerR=238, innerR=218, holeR=196 in a 500×500 viewBox centered at 250,250
  const gearD = useMemo(() => buildGearPath(250, 250, 238, 218, 196, 20), []);

  if (phase === "gone") return null;

  return (
    <div className={`intro intro--${phase}`} aria-hidden>
      <div className="intro__map-stage">
        <img src="/erzurum-map.svg" className="intro__map" alt="" decoding="async" />
        <div className="intro__map-veil" />
        <div className="intro__scan" />

        <svg
          className="intro__network-lines"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          {networkNodes.slice(1).map((node) => (
            <line
              key={node.id}
              x1={node.x}
              y1={node.y}
              x2={centerNode.x}
              y2={centerNode.y}
              style={{ "--line-delay": `${node.delay + 0.25}s` } as CSSProperties}
            />
          ))}
        </svg>

        <div className="intro__network-nodes">
          {networkNodes.map((node) => (
            <span
              key={node.id}
              className={`intro__network-node ${node.center ? "is-center" : ""}`}
              style={
                {
                  "--x": `${node.x}%`,
                  "--y": `${node.y}%`,
                  "--node-delay": `${node.delay}s`,
                } as CSSProperties
              }
            >
              <span className="intro__node-ring" />
              <span className="intro__node-dot" />
              <span className="intro__node-label mono">{node.label}</span>
            </span>
          ))}
        </div>
      </div>

      <div className="intro__bg" />
      <div className="intro__rays" />

      <div className="intro__status mono">
        <span className="intro__status-dot" />
        Bölgesel ticaret ağı kuruluyor
      </div>

      <div className="intro__center">
        {/* Logo + decorative rings anchored together */}
        <div className="intro__logo-wrap">
          <div className="intro__rings" aria-hidden>
            {/* Slowly spinning toothed gear ring */}
            <svg viewBox="0 0 500 500" className="intro__gear">
              <path d={gearD} fillRule="evenodd" />
            </svg>

            {/* Pulsing smooth ring just outside the gear */}
            <svg viewBox="0 0 580 580" className="intro__ring-pulse">
              <circle cx="290" cy="290" r="273" />
            </svg>

            {/* Fine radial tick marks — compass / clock detail */}
            <svg viewBox="0 0 640 640" className="intro__ticks">
              {Array.from({ length: 60 }).map((_, i) => {
                const angle = (i * 360) / 60;
                const long = i % 5 === 0;
                return (
                  <line
                    key={i}
                    x1="320"
                    y1={long ? 16 : 22}
                    x2="320"
                    y2={long ? 34 : 28}
                    transform={`rotate(${angle} 320 320)`}
                  />
                );
              })}
            </svg>
          </div>

          <div className="intro__logo">
            <img
              src="/erzurum-ticaret-borsasi-logo.png"
              alt="Erzurum Ticaret Borsası"
            />
          </div>
        </div>

        {/* Text block */}
        <div className="intro__caption">
          <h1 className="intro__title">Erzurum Ticaret Borsası</h1>
          <span className="intro__sub mono">
            1946 · Doğu Anadolu'nun Ticaret Nabzı
          </span>
        </div>

        {/* Loading bar */}
        <div className="intro__bar">
          <div className="intro__bar-fill" />
        </div>
      </div>

      {/* Corner labels */}
      <div className="intro__corner intro__corner--tl mono">
        ETB · TR-25
      </div>
      <div className="intro__corner intro__corner--tr mono">
        Kuruluş · 1946
      </div>
      <div className="intro__corner intro__corner--bl mono">
        Buğday · Arpa · Mısır · Bakliyat · Canlı Hayvan
      </div>
      <div className="intro__corner intro__corner--br mono">
        Piyasa Verileri · Fiyat Bülteni · Raporlar
      </div>
    </div>
  );
}
