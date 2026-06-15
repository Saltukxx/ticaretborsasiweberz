import { useMemo, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import { usePublicProjects, usePublicStatsByGroup } from "../hooks/usePublicApi";
import { useCountUp, useReveal } from "../hooks/useReveal";
import {
  splitShowcaseProjects,
  uniqueFocusAreas,
} from "../lib/mapPublicProjects";
import { mapImpactStats } from "../lib/mapImpactStats";
import { revealClass } from "../lib/revealClass";
import ProjectOngoingCard from "./ProjectOngoingCard";
import "./ProjectsShowcase.css";

const defaultImpactStats = [
  { value: 6, label: "Dijital hizmet adımı" },
  { value: 12, label: "Standart rapor" },
  { value: 4, label: "Üye temas noktası" },
  { value: 8, label: "Şeffaf veri seti" },
];

export default function ProjectsShowcase() {
  const { data: impactData } = usePublicStatsByGroup("projects_impact");
  const { data: apiProjects, isLoading, isError } = usePublicProjects(50);

  const impactStats = useMemo(
    () => mapImpactStats(impactData, defaultImpactStats),
    [impactData],
  );
  const contentReady = !isLoading && !isError;

  const { ongoingProjects, completedProjects, focusAreas, focusAreaCount } = useMemo(() => {
    const all = apiProjects ?? [];
    const { ongoing, completed } = splitShowcaseProjects(all);
    const areas = uniqueFocusAreas(all);
    return {
      ongoingProjects: ongoing,
      completedProjects: completed,
      focusAreas: areas,
      focusAreaCount: areas.length,
    };
  }, [apiProjects]);

  const overviewRef = useReveal<HTMLDivElement>();
  const ongoingRef = useReveal<HTMLDivElement>();
  const completedRef = useReveal<HTMLDivElement>();
  const impactRef = useReveal<HTMLDivElement>();

  return (
    <section className="projects-showcase">
      <div className="container">
        <div
          className={`projects-showcase__overview reveal ${revealClass(contentReady)}`}
          ref={overviewRef}
        >
          <div>
            <span className="eyebrow">Proje Portföyü</span>
            <h2>
              Kurumsal kapasiteyi ve bölgesel ticareti <em>ölçülebilir projelerle</em> güçlendiriyoruz.
            </h2>
            {isLoading ? (
              <p className="projects-showcase__status">Projeler yükleniyor…</p>
            ) : isError ? (
              <p className="projects-showcase__status">Proje listesi şu an yüklenemedi.</p>
            ) : focusAreas.length > 0 ? (
              <div className="projects-showcase__focus" aria-label="Proje odak alanları">
                {focusAreas.map((area, index) => (
                  <span key={area} style={{ "--delay": `${index * 0.06}s` } as CSSProperties}>
                    {area}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
          <div className="projects-showcase__numbers" aria-label="Proje özeti">
            <SummaryNumber value={ongoingProjects.length} label="Devam Eden" ready={contentReady} />
            <SummaryNumber
              value={completedProjects.length}
              label="Tamamlanan"
              ready={contentReady}
            />
            <SummaryNumber value={focusAreaCount} label="Odak Alanı" ready={contentReady} />
          </div>
        </div>

        <div className={`projects-lane reveal ${revealClass(contentReady)}`} ref={ongoingRef}>
          <div className="projects-lane__head">
            <span className="eyebrow">Devam Eden Projeler</span>
            <h2>Yürürlükteki çalışmalar, hedef tarih ve ilerleme oranıyla izlenir.</h2>
          </div>

          {ongoingProjects.length === 0 && contentReady ? (
            <p className="projects-showcase__status">
              Yayında devam eden proje bulunmuyor. Yeni projeler yönetim panelinden eklenebilir.
            </p>
          ) : (
          <div className="projects-lane__grid">
            {ongoingProjects.map((project, index) => (
              <ProjectOngoingCard key={project.id} project={project} index={index} />
            ))}
          </div>
          )}
        </div>

        <div className={`projects-archive reveal ${revealClass(contentReady)}`} ref={completedRef}>
          <div className="projects-archive__head">
            <div>
              <span className="eyebrow">Tamamlanan Projeler</span>
              <h2>Tamamlanan çalışmalar kurumsal hafızaya ve hizmet standardına dönüşür.</h2>
            </div>
            <p>
              Bu alan, borsanın tamamlanmış dijitalleşme, raporlama ve üye hizmeti çalışmalarını
              kısa sonuçlarıyla birlikte sergiler.
            </p>
          </div>

          {completedProjects.length === 0 && contentReady ? (
            <p className="projects-showcase__status">Yayında tamamlanan proje bulunmuyor.</p>
          ) : (
          <div className="projects-archive__grid">
            {completedProjects.map((project, index) => (
              <article
                className="projects-archive__card"
                key={project.id}
                style={{ "--delay": `${index * 0.12}s` } as CSSProperties}
              >
                <span className="projects-archive__node" aria-hidden />
                <div className="projects-archive__year-wrap">
                  <span className="projects-archive__year mono">{project.year}</span>
                </div>
                <div className="projects-archive__body">
                  <span className="projects-archive__field mono">{project.field}</span>
                  <div className="projects-archive__title-row">
                    <h3>{project.title}</h3>
                    <span className="projects-archive__stamp mono">{project.year}</span>
                  </div>
                  <p>{project.summary}</p>
                  <div className="projects-archive__result">
                    <div className="projects-archive__metric">
                      <MetricValue value={project.metric.value} />
                      <span>{project.metric.label}</span>
                    </div>
                    <div>
                      <span>{project.impact}</span>
                      <strong>{project.result}</strong>
                    </div>
                  </div>
                  {project.hasBody && (
                    <Link
                      to={`/projeler/${project.slug}`}
                      className="projects-archive__detail mono"
                    >
                      Detayı İncele →
                    </Link>
                  )}
                </div>
              </article>
            ))}
          </div>
          )}
        </div>

        <div className={`projects-impact reveal ${revealClass(contentReady)}`} ref={impactRef}>
          <div>
            <span className="eyebrow">Etki Haritası</span>
            <h2>Tamamlanan projelerin etkisi kurum hafızasında ölçülebilir iz bırakır.</h2>
          </div>
          <div className="projects-impact__grid" aria-label="Tamamlanan proje etki göstergeleri">
            {impactStats.map((stat, index) => (
              <ImpactStat key={stat.label} value={stat.value} label={stat.label} index={index} />
            ))}
          </div>
          <span className="projects-impact__stamp mono">ETB · Kurumsal Hafıza</span>
        </div>
      </div>
    </section>
  );
}

function SummaryNumber({
  value,
  label,
  ready,
}: {
  value: number;
  label: string;
  ready: boolean;
}) {
  const reducedMotion = useReducedMotion();
  const ref = useCountUp(value, 1400, !reducedMotion && ready);

  return (
    <div className="projects-showcase__number">
      <strong className="mono">
        <span ref={ref}>{String(value).padStart(2, "0")}</span>
      </strong>
      <span>{label}</span>
    </div>
  );
}

function ImpactStat({ value, label, index }: { value: number; label: string; index: number }) {
  const reducedMotion = useReducedMotion();
  const ref = useCountUp(value, 1300, !reducedMotion);

  return (
    <div className="projects-impact__stat" style={{ "--delay": `${index * 0.08}s` } as CSSProperties}>
      <strong className="mono">
        <span ref={ref}>{String(value).padStart(2, "0")}</span>
      </strong>
      <span>{label}</span>
    </div>
  );
}

function MetricValue({ value }: { value: string }) {
  const parsed = parseMetric(value);
  const reducedMotion = useReducedMotion();
  const ref = useCountUp(parsed?.target ?? 0, 1200, !reducedMotion);

  if (!parsed) {
    return <strong className="mono">{value}</strong>;
  }

  return (
    <strong className="mono">
      {parsed.prefix}
      <span ref={ref}>{parsed.fallback}</span>
      {parsed.suffix}
    </strong>
  );
}

function parseMetric(value: string) {
  const match = value.match(/^([+-]?)(\d+(?:[.,]\d+)?)(.*)$/);
  if (!match) return null;

  const [, prefix, rawNumber, suffix] = match;
  const normalized = rawNumber.replace(",", ".");

  return {
    prefix,
    target: Number(normalized),
    suffix,
    fallback: rawNumber,
  };
}

function useReducedMotion() {
  return useMemo(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    []
  );
}
