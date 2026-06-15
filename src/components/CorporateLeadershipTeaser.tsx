import { Link } from "react-router-dom";
import { usePublicLeadership } from "../hooks/usePublicApi";
import type { PublicLeader } from "../lib/publicApi";
import { resolveMediaUrl } from "../lib/resolveMediaUrl";
import { useReveal } from "../hooks/useReveal";
import "./CorporateLeadershipTeaser.css";

const GROUPS: { key: string; label: string; desc: string }[] = [
  { key: "yonetim_kurulu", label: "Yönetim Kurulu", desc: "Karar organı" },
  { key: "meclis", label: "Meclis", desc: "Temsil organı" },
  { key: "tobb_delegeleri", label: "TOBB Delegeleri", desc: "Ulusal temsil" },
  { key: "personel", label: "Genel Sekreterlik", desc: "İdari kadro" },
  { key: "danisman", label: "Danışman", desc: "Stratejik akıl" },
];

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter((p) => !p.endsWith(".") && p.length > 1)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toLocaleUpperCase("tr-TR");
}

function MiniPortrait({ leader }: { leader: PublicLeader }) {
  const src = leader.portraitUrl ? resolveMediaUrl(leader.portraitUrl) : null;
  if (src) {
    return (
      <img
        className="corp-lead__avatar-img"
        src={src}
        alt=""
        loading="lazy"
        decoding="async"
      />
    );
  }
  return <span className="corp-lead__avatar-fallback">{initials(leader.name)}</span>;
}

export default function CorporateLeadershipTeaser() {
  const ref = useReveal<HTMLElement>();
  const { data: leaders, isLoading } = usePublicLeadership();
  const list = leaders ?? [];

  const byGroup = (key: string) =>
    list.filter((l) => (l.groupKey ?? "yonetim_kurulu") === key);

  const board = byGroup("yonetim_kurulu");
  const head = board[0] ?? null;
  const boardRest = board.slice(1, 7);
  const total = list.length;

  return (
    <section className="corp-lead reveal" ref={ref} aria-labelledby="corp-lead-title">
      <div className="container">
        <Link to="/kurumsal/yonetim" className="corp-lead__shell">
          <div className="corp-lead__copy">
            <span className="mono corp-lead__eyebrow">Organizasyon · Kadro</span>
            <h2 id="corp-lead-title">
              Kurumsal <em>Yapımız</em>
            </h2>
            <p className="corp-lead__intro">
              Yönetim kurulundan meclise, TOBB delegelerinden genel sekreterlik
              kadrosuna — borsayı taşıyan {total > 0 ? `${total} kişilik` : ""} ekip
              tek sayfada.
            </p>

            <ul className="corp-lead__groups" aria-label="Organizasyon birimleri">
              {GROUPS.map((g) => {
                const count = byGroup(g.key).length;
                if (count === 0 && !isLoading) return null;
                return (
                  <li key={g.key} className="corp-lead__group">
                    <strong>{isLoading ? "—" : count}</strong>
                    <span>{g.label}</span>
                    <small>{g.desc}</small>
                  </li>
                );
              })}
            </ul>

            <span className="corp-lead__cta btn btn-primary">
              Yönetim Kadrosunu İncele
              <svg viewBox="0 0 20 20" aria-hidden>
                <path d="M4 10h12M11 5l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </div>

          <div className="corp-lead__visual" aria-hidden={isLoading && !head}>
            <div className="corp-lead__visual-bg" />
            {head && (
              <figure className="corp-lead__featured">
                {head.portraitUrl ? (
                  <img
                    src={resolveMediaUrl(head.portraitUrl)}
                    alt=""
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  <span className="corp-lead__featured-fallback">{initials(head.name)}</span>
                )}
                <figcaption>
                  <span>{head.name}</span>
                  <strong>{head.title}</strong>
                </figcaption>
              </figure>
            )}

            {boardRest.length > 0 && (
              <div className="corp-lead__stack">
                {boardRest.map((leader) => (
                  <span className="corp-lead__avatar" key={leader.id} title={leader.name}>
                    <MiniPortrait leader={leader} />
                  </span>
                ))}
                {board.length > 7 && (
                  <span className="corp-lead__avatar corp-lead__avatar--more">
                    +{board.length - 7}
                  </span>
                )}
              </div>
            )}

            <div className="corp-lead__badge mono">
              <span>5 birim</span>
              <span>{isLoading ? "…" : `${total} kişi`}</span>
            </div>
          </div>
        </Link>
      </div>
    </section>
  );
}
