import { useCorporate } from "../hooks/usePublicApi";
import { formatDisplayHeading } from "../lib/formatDisplayHeading";
import { useReveal } from "../hooks/useReveal";
import "./CorporateSection.css";

const FALLBACK_LEAD =
  "Bölgemizin üretim, ticaret ve piyasa yapısına güvenilir kurumsal altyapı sunuyoruz.";
const FALLBACK_MISSION =
  "Üretici, tüccar ve sanayiciye şeffaf piyasa verisi ve kurumsal hizmet üreterek bölgesel ticarete istikrar kazandırmak.";
const FALLBACK_VISION =
  "Doğu Anadolu'nun dijitalleşen, veri odaklı ve uluslararası standartlara uyumlu ticaret merkezi olmak.";

export default function CorporateSection({
  showLeadershipCta = true,
}: {
  showLeadershipCta?: boolean;
}) {
  const { data, isLoading, isError } = useCorporate();
  const ref = useReveal<HTMLDivElement>();

  const profile = data?.profile;
  const milestones = data?.milestones ?? [];
  const { lead: headingLead, emphasis: headingEmphasis } = formatDisplayHeading(profile?.heading);
  const showContent = !isLoading && !isError;

  return (
    <section className="corp">
      <div className="container">
        <div className="corp__grid">
          <div className="corp__copy reveal" ref={useReveal<HTMLDivElement>()}>
            <span className="eyebrow">{profile?.eyebrow ?? "Kurumsal · 1946'dan Beri"}</span>
            <h2>
              {headingEmphasis ? (
                <>
                  {headingLead} <em className="corp__em">{headingEmphasis}</em>
                </>
              ) : (
                headingLead
              )}
            </h2>
            <p className="corp__lead">
              {isLoading ? "Yükleniyor…" : isError ? "Kurumsal içerik şu an yüklenemedi." : profile?.lead ?? FALLBACK_LEAD}
            </p>

            {isError ? (
              <p className="corp__status">Lütfen daha sonra tekrar deneyin.</p>
            ) : (
              <div className="corp__mv">
                <div className="corp__mv-card">
                  <span className="mono">Misyon</span>
                  <p>{showContent ? profile?.mission ?? FALLBACK_MISSION : "—"}</p>
                </div>
                <div className="corp__mv-card">
                  <span className="mono">Vizyon</span>
                  <p>{showContent ? profile?.vision ?? FALLBACK_VISION : "—"}</p>
                </div>
              </div>
            )}

            <div className="corp__cta">
              <a className="btn btn-primary" href="/kurumsal/belgeler/borsa-tarihce">
                Kurumsal Tarihçeyi İncele
              </a>
              {showLeadershipCta && (
                <a className="btn btn-ghost" href="/kurumsal/yonetim">
                  Yönetim Kadrosu
                </a>
              )}
              <a className="btn-link" href="/iletisim">
                Bize Ulaşın
              </a>
            </div>
          </div>

          <aside className="corp__time reveal-stagger" ref={ref}>
            <div className="corp__time-rail" aria-hidden />
            {!isLoading && !isError && milestones.length === 0 ? (
              <p className="corp__status">Henüz kilometre taşı eklenmemiş.</p>
            ) : null}
            {milestones.map((m, i) => (
              <div className="corp__time-row" key={m.id}>
                <span className="corp__time-year mono">{m.year}</span>
                <span className="corp__time-dot" />
                <div className="corp__time-body">
                  <h4>{m.title}</h4>
                  <p>{m.description}</p>
                </div>
                <span className="corp__time-num mono">{String(i + 1).padStart(2, "0")}</span>
              </div>
            ))}
          </aside>
        </div>
      </div>
    </section>
  );
}
