import { useMemo, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import PageHero from "../components/PageHero";
import EventsPreview from "../components/EventsPreview";
import ProjectsShowcase from "../components/ProjectsShowcase";
import { usePublicProjects } from "../hooks/usePublicApi";
import { useCountUp } from "../hooks/useReveal";
import { splitShowcaseProjects, uniqueFocusAreas } from "../lib/mapPublicProjects";

const pulseWords = ["dijital dönüşüm", "üretici hizmeti", "piyasa şeffaflığı", "kurumsal kapasite"];

export default function ProjectsPage() {
  return (
    <>
      <PageHero
        breadcrumb="Projeler"
        eyebrow="Kurumsal Gelişim · Bölgesel Kalkınma"
        title={<>Borsanın Bölgesel <em>Kalkınma Projeleri</em></>}
        intro="Erzurum Ticaret Borsası'nın dijital dönüşüm, üretici hizmetleri, piyasa şeffaflığı ve kurumsal kapasite alanlarında yürüttüğü projeleri tek bir prestijli vitrinde inceleyin."
      />
      <ProjectPulseStrip />
      <ProjectsShowcase />
      <EventsPreview variant="projects" />
      <section className="projects-cta" aria-labelledby="projects-cta-title">
        <div className="container projects-cta__inner">
          <div>
            <span className="eyebrow">Proje İletişimi</span>
            <h2 id="projects-cta-title">Yeni bir proje öneriniz mi var?</h2>
            <p>
              Bölgesel ticareti güçlendirecek iş birlikleri, dijital hizmet fikirleri ve üretici
              odaklı proje teklifleri için kurumla doğrudan temas kurun.
            </p>
          </div>
          <div className="projects-cta__actions">
            <Link className="btn btn-primary" to="/iletisim">İletişime Geçin</Link>
            <Link className="btn btn-ghost" to="/iletisim">Proje Teklif Formu</Link>
          </div>
        </div>
      </section>
    </>
  );
}

function ProjectPulseStrip() {
  const { data: apiProjects } = usePublicProjects(50);
  const pulseStats = useMemo(() => {
    const all = apiProjects ?? [];
    const { ongoing, completed } = splitShowcaseProjects(all);
    const focusCount = uniqueFocusAreas(all).length;
    return [
      { value: ongoing.length, label: "Devam Eden" },
      { value: completed.length, label: "Tamamlanan" },
      { value: focusCount, label: "Odak Alanı" },
    ];
  }, [apiProjects]);

  return (
    <section className="projects-pulse" aria-label="Projeler sayfası hızlı özet">
      <div className="container projects-pulse__inner">
        <div className="projects-pulse__words" aria-live="off">
          <span className="mono">Odak</span>
          <strong>
            {pulseWords.map((word, index) => (
              <span key={word} style={{ "--word-index": index } as CSSProperties}>
                {word}
              </span>
            ))}
          </strong>
        </div>
        <div className="projects-pulse__stats" aria-label="Proje portföyü özeti">
          {pulseStats.map((stat) => (
            <PulseStat key={stat.label} value={stat.value} label={stat.label} />
          ))}
        </div>
        <div className="projects-pulse__stamp mono">
          <span>Son güncelleme · Mayıs 2026</span>
          <Link to="/iletisim">Yeni proje teklif et</Link>
        </div>
      </div>
    </section>
  );
}

function PulseStat({ value, label }: { value: number; label: string }) {
  const reducedMotion = useReducedMotion();
  const ref = useCountUp(value, 1200, !reducedMotion);

  return (
    <div className="projects-pulse__stat">
      <strong className="mono">
        <span ref={ref}>{String(value).padStart(2, "0")}</span>
      </strong>
      <span>{label}</span>
    </div>
  );
}

function useReducedMotion() {
  return useMemo(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    []
  );
}
