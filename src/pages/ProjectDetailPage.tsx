import { Link, useParams } from "react-router-dom";
import PageHero from "../components/PageHero";
import SeoHead from "../components/SeoHead";
import { usePublicProject } from "../hooks/usePublicApi";
import { ApiError } from "../lib/publicApi";
import { resolveMediaUrl } from "../lib/resolveMediaUrl";
import { sanitizeRichHtml } from "../lib/sanitizeHtml";
import "./ProjectDetailPage.css";

function statusLabel(status: string | undefined): string {
  return status === "completed" ? "Tamamlanan" : "Devam Eden";
}

export default function ProjectDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: project, isLoading, error } = usePublicProject(slug);
  const err404 = error instanceof ApiError && error.status === 404;
  const path = slug ? `/projeler/${slug}` : "/projeler";
  const coverSrc = project?.coverUrl ? resolveMediaUrl(project.coverUrl) : null;

  return (
    <>
      <SeoHead
        title={project?.title ?? (err404 ? "Proje bulunamadı" : "Proje")}
        description={project?.description ?? "Erzurum Ticaret Borsası kurumsal proje detayı."}
        path={path}
        image={coverSrc ?? undefined}
        noindex={err404}
      />
      <PageHero
        breadcrumb="Projeler"
        eyebrow={project?.field ?? "Proje"}
        title={project?.title ?? (err404 ? "Proje bulunamadı" : "Proje")}
        intro={project?.description ?? "Kurumsal proje detayı."}
      />
      <section className="project-detail">
        <div className="container project-detail__inner">
          <nav className="project-detail__back mono">
            <Link to="/projeler">← Tüm projeler</Link>
          </nav>

          {isLoading && <p className="project-detail__state">Proje yükleniyor…</p>}

          {!isLoading && error && (
            <p className="project-detail__state project-detail__state--error">
              {err404
                ? "Proje bulunamadı veya yayından kaldırılmış olabilir."
                : "Proje yüklenirken bir sorun oluştu."}
            </p>
          )}

          {!isLoading && project && (
            <article
              className={`project-detail__article${coverSrc ? " project-detail__article--with-cover" : ""}`}
            >
              {coverSrc && (
                <figure className="project-detail__cover">
                  <img
                    src={coverSrc}
                    alt={project.title}
                    loading="eager"
                    decoding="async"
                  />
                </figure>
              )}

              <div className="project-detail__panel card">
                <header className="project-detail__meta mono">
                  <span className="project-detail__chip">{statusLabel(project.status)}</span>
                  {project.field && <span>{project.field}</span>}
                  {project.year && <span>{project.year}</span>}
                  {project.completedAt && (
                    <time dateTime={project.completedAt}>
                      Tamamlanma · {project.completedAt.slice(0, 10)}
                    </time>
                  )}
                </header>

                {project.description && (
                  <p className="project-detail__lead">{project.description}</p>
                )}

                {project.body ? (
                  <div
                    className="project-detail__body"
                    dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(project.body) }}
                  />
                ) : null}
              </div>
            </article>
          )}
        </div>
      </section>
    </>
  );
}
