import { useMemo, useState } from "react";
import { useReveal } from "../hooks/useReveal";
import "./RegionalMap.css";

interface Node {
  id: string;
  lon: number;
  lat: number;
  label: string;
  prod: string;
  v: string;
}

const nodes: Node[] = [
  { id: "merkez", lon: 41.2769, lat: 39.9043, label: "Erzurum Merkez", prod: "Hububat · Tescil Merkezi", v: "284,5 ton" },
  { id: "pasinler", lon: 41.6783, lat: 39.9789, label: "Pasinler", prod: "Buğday · Arpa", v: "62,4 ton" },
  { id: "horasan", lon: 42.1731, lat: 40.0408, label: "Horasan", prod: "Hububat · Bakliyat", v: "48,1 ton" },
  { id: "askale", lon: 40.6928, lat: 39.9214, label: "Aşkale", prod: "Yemlik · Hayvancılık", v: "33,6 ton" },
  { id: "ispir", lon: 40.9947, lat: 40.4742, label: "İspir", prod: "Süt Ürünleri", v: "12,8 ton" },
  { id: "oltu", lon: 41.9847, lat: 40.5439, label: "Oltu", prod: "Tarımsal Karışık", v: "21,5 ton" },
  { id: "tortum", lon: 41.5494, lat: 40.2950, label: "Tortum", prod: "Hayvancılık", v: "18,2 ton" },
  { id: "narman", lon: 41.8847, lat: 40.3417, label: "Narman", prod: "Hububat", v: "14,4 ton" },
  { id: "cat", lon: 40.9925, lat: 39.6097, label: "Çat", prod: "Yemlik · Arpa", v: "11,9 ton" },
];

// Map bbox — calibrated so Erzurum Merkez (lon 41.2769, lat 39.9043) lands on
// the visible city cluster of the underlying poster (≈ horizontal center,
// slightly above vertical middle). The poster is portrait 2451×3467, centered
// on (lat 39.9063, lon 41.2728). Adjust these four numbers if district nodes
// appear misaligned with the underlying map.
const MAP_BBOX = {
  lonMin: 40.40,
  lonMax: 42.15,
  latMin: 38.95,
  latMax: 40.86,
};

const project = (lon: number, lat: number): { x: number; y: number } => {
  const x = ((lon - MAP_BBOX.lonMin) / (MAP_BBOX.lonMax - MAP_BBOX.lonMin)) * 100;
  const y = (1 - (lat - MAP_BBOX.latMin) / (MAP_BBOX.latMax - MAP_BBOX.latMin)) * 100;
  return { x, y };
};

export default function RegionalMap() {
  const [active, setActive] = useState<Node>(nodes[0]);
  const ref = useReveal<HTMLDivElement>();

  const projectedNodes = useMemo(
    () =>
      nodes.map((n) => {
        const { x, y } = project(n.lon, n.lat);
        return { ...n, x, y };
      }),
    []
  );

  const centerNode = projectedNodes[0];

  return (
    <section className="rmap">
      <div className="container">
        <div className="section-title reveal" ref={useReveal<HTMLDivElement>()}>
          <div>
            <span className="eyebrow">Bölgesel Ticaret Ağı · Erzurum</span>
            <h2>
              Bölgesel <em className="rmap__em">Ticaret Ağı</em>
            </h2>
          </div>
          <p>
            Erzurum ve çevresindeki tarımsal üretim, ticaret ve piyasa hareketlerini
            bölgesel ölçekte destekleyen kurumsal yapı.
          </p>
        </div>

        <div className="rmap__shell reveal" ref={ref}>
          <div className="rmap__map-wrap">
            <div className="rmap__map">
              <img
                src="/erzurum-map.png"
                className="rmap__map-img"
                alt="Erzurum bölgesi haritası"
                loading="lazy"
                decoding="async"
              />
              <div className="rmap__vignette" aria-hidden="true" />

              <svg
                className="rmap__overlay-svg"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                {projectedNodes.slice(1).map((n) => (
                  <line
                    key={`l-${n.id}`}
                    x1={centerNode.x}
                    y1={centerNode.y}
                    x2={n.x}
                    y2={n.y}
                    className={`rmap__link ${active.id === n.id ? "is-active" : ""}`}
                  />
                ))}
              </svg>

              <div className="rmap__overlay">
                {projectedNodes.map((n) => {
                  const isCenter = n.id === "merkez";
                  const isActive = active.id === n.id;
                  return (
                    <button
                      key={n.id}
                      type="button"
                      className={`rmap__node ${isActive ? "is-active" : ""} ${isCenter ? "is-center" : ""}`}
                      style={{ left: `${n.x}%`, top: `${n.y}%` }}
                      onMouseEnter={() => setActive(n)}
                      onFocus={() => setActive(n)}
                      onClick={() => setActive(n)}
                      aria-label={n.label}
                    >
                      <span className="rmap__node-ring" />
                      <span className="rmap__node-dot" />
                      <span className="rmap__node-label">{n.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            <p className="rmap__attribution mono">
              Harita: © OpenStreetMap katılımcıları · © terraink.app
            </p>
          </div>

          <aside className="rmap__panel">
            <span className="mono rmap__panel-cat">Aktif Konum</span>
            <h3>{active.label}</h3>
            <p>{active.prod}</p>

            <div className="rmap__stats">
              <div>
                <span className="mono">Günlük Hacim</span>
                <strong className="tabular">{active.v}</strong>
              </div>
              <div>
                <span className="mono">Bağlı Üye</span>
                <strong className="tabular">{Math.floor(80 + Math.random() * 240)}</strong>
              </div>
              <div>
                <span className="mono">Tescil İşlemi</span>
                <strong className="tabular">{Math.floor(280 + Math.random() * 1200)}</strong>
              </div>
            </div>

            <div className="rmap__legend mono">
              <span className="rmap__legend-item">
                <span className="rmap__legend-dot rmap__legend-dot--gold" />
                Tescil Merkezi
              </span>
              <span className="rmap__legend-item">
                <span className="rmap__legend-dot rmap__legend-dot--g" />
                İlçe Noktası
              </span>
              <span className="rmap__legend-item">
                <span className="rmap__legend-swatch rmap__legend-swatch--link" />
                Aktif Bağlantı
              </span>
            </div>

            <a className="btn-link" href="/piyasa-verileri">Bölgesel Veriye Git</a>
          </aside>
        </div>
      </div>
    </section>
  );
}
