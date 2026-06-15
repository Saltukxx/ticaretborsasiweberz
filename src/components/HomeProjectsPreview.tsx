import { useMemo } from "react";
import { Link } from "react-router-dom";
import { usePublicProjects } from "../hooks/usePublicApi";
import { splitShowcaseProjects } from "../lib/mapPublicProjects";
import { useRevealCallback } from "../hooks/useReveal";
import ProjectOngoingCard from "./ProjectOngoingCard";
import "./HomeProjectsPreview.css";

const HOME_PREVIEW_COUNT = 3;

export default function HomeProjectsPreview() {
  const gridRef = useRevealCallback<HTMLDivElement>();
  const { data: apiProjects, isLoading, isError } = usePublicProjects(50);

  const previewProjects = useMemo(() => {
    const { ongoing } = splitShowcaseProjects(apiProjects ?? []);
    return ongoing.slice(0, HOME_PREVIEW_COUNT);
  }, [apiProjects]);

  if (!isLoading && !isError && previewProjects.length === 0) return null;

  return (
    <section className="home-projects" aria-labelledby="home-projects-title">
      <div className="container">
        <header className="home-projects__head">
          <div>
            <span className="eyebrow">Projelerimiz</span>
            <h2 id="home-projects-title">
              Bölgesel kalkınmayı taşıyan <em>kurumsal projeler</em>
            </h2>
            <p className="home-projects__intro">
              Hayvancılıktan gastronomiye, depoculuktan turizme — Erzurum Ticaret Borsası&apos;nın
              yürüttüğü projeleri keşfedin.
            </p>
          </div>
          <Link className="btn btn-ghost home-projects__cta" to="/projeler">
            Tüm projeleri gör
          </Link>
        </header>

        {isLoading && (
          <p className="home-projects__state">Projeler yükleniyor…</p>
        )}

        {!isLoading && isError && (
          <p className="home-projects__state">Proje listesi şu an yüklenemedi.</p>
        )}

        {!isLoading && !isError && previewProjects.length > 0 && (
          <div className="home-projects__grid" ref={gridRef}>
            {previewProjects.map((project, index) => (
              <ProjectOngoingCard
                key={project.id}
                project={project}
                index={index}
                compact
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
