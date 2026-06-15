import { useMemo, useState } from "react";
import { useMapDistricts } from "../hooks/usePublicApi";
import {
  CENTER_DISTRICT_SLUG,
  DISTRICT_FALLBACK,
  DISTRICT_POSITIONS,
  DISTRICT_SLUG_ORDER,
  MAP_BBOX,
  type DistrictSlug,
} from "../lib/mapDistrictPositions";
import type { PublicMapDistrict } from "../lib/publicApi";
import { useReveal } from "../hooks/useReveal";
import "./RegionalMap.css";

interface Node {
  id: string;
  lon: number;
  lat: number;
  label: string;
  prod: string;
  v: string;
  memberCount: number;
  registrationCount: number;
}

const project = (lon: number, lat: number): { x: number; y: number } => {
  const x = ((lon - MAP_BBOX.lonMin) / (MAP_BBOX.lonMax - MAP_BBOX.lonMin)) * 100;
  const y = (1 - (lat - MAP_BBOX.latMin) / (MAP_BBOX.latMax - MAP_BBOX.latMin)) * 100;
  return { x, y };
};

function buildNode(slug: DistrictSlug, row?: PublicMapDistrict): Node | null {
  const pos = DISTRICT_POSITIONS[slug];
  const fallback = DISTRICT_FALLBACK[slug];
  if (!pos || !fallback) return null;

  return {
    id: slug,
    lon: pos.lon,
    lat: pos.lat,
    label: row?.label ?? fallback.label,
    prod: row?.productLine ?? fallback.productLine,
    v: row?.dailyVolume ?? fallback.dailyVolume,
    memberCount: row?.memberCount ?? fallback.memberCount,
    registrationCount: row?.registrationCount ?? fallback.registrationCount,
  };
}

export default function RegionalMap() {
  const { data: apiRows, isLoading, isError } = useMapDistricts();
  const ref = useReveal<HTMLDivElement>();

  const nodes = useMemo(() => {
    const bySlug = new Map((apiRows ?? []).map((r) => [r.slug, r]));
    return DISTRICT_SLUG_ORDER.map((slug) => buildNode(slug, bySlug.get(slug))).filter(
      (node): node is Node => node != null,
    );
  }, [apiRows]);

  const projectedNodes = useMemo(
    () =>
      nodes.map((n) => {
        const { x, y } = project(n.lon, n.lat);
        return { ...n, x, y };
      }),
    [nodes],
  );

  const centerNode = useMemo(
    () => projectedNodes.find((n) => n.id === CENTER_DISTRICT_SLUG) ?? projectedNodes[0],
    [projectedNodes],
  );

  const [active, setActive] = useState<Node | null>(null);
  const activeNode = active ?? centerNode ?? nodes[0] ?? null;

  if (!activeNode || !centerNode) {
    return null;
  }

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
            Erzurum merkez tescil noktası ve 17 ilçede tarımsal üretim, ticaret ve
            piyasa hareketlerini bölgesel ölçekte destekleyen kurumsal yapı.
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
                {projectedNodes
                  .filter((n) => n.id !== centerNode.id)
                  .map((n) => (
                    <line
                      key={`l-${n.id}`}
                      x1={centerNode.x}
                      y1={centerNode.y}
                      x2={n.x}
                      y2={n.y}
                      className={`rmap__link ${activeNode.id === n.id ? "is-active" : ""}`}
                    />
                  ))}
              </svg>

              <div className="rmap__overlay">
                {projectedNodes.map((n) => {
                  const isCenter = n.id === CENTER_DISTRICT_SLUG;
                  const isActive = activeNode.id === n.id;
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
            {isLoading && <p className="rmap__status">Veriler yükleniyor…</p>}
            {isError && !isLoading && (
              <p className="rmap__status rmap__status--warn">
                Canlı ilçe verisi yüklenemedi; varsayılan değerler gösteriliyor.
              </p>
            )}
            <h3>{activeNode.label}</h3>
            <p>{activeNode.prod}</p>

            <div className="rmap__stats">
              <div>
                <span className="mono">Günlük Hacim</span>
                <strong className="tabular">{activeNode.v}</strong>
              </div>
              <div>
                <span className="mono">Bağlı Üye</span>
                <strong className="tabular">{activeNode.memberCount}</strong>
              </div>
              <div>
                <span className="mono">Tescil İşlemi</span>
                <strong className="tabular">{activeNode.registrationCount}</strong>
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

            <a className="btn-link" href="/piyasa-verileri">
              Bölgesel Veriye Git
            </a>
          </aside>
        </div>
      </div>
    </section>
  );
}

