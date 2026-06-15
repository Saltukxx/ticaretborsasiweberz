import { type CSSProperties } from "react";
import { Link } from "react-router-dom";
import {
  hasMeaningfulTracking,
  type ShowcaseOngoingProject,
  type ShowcaseProjectIcon,
} from "../lib/mapPublicProjects";

interface ProjectOngoingCardProps {
  project: ShowcaseOngoingProject;
  index?: number;
  compact?: boolean;
}

export default function ProjectOngoingCard({
  project,
  index = 0,
  compact = false,
}: ProjectOngoingCardProps) {
  const showPhaseSteps = hasMeaningfulTracking(project);
  const activePhase = project.phases.findIndex((phase) => !phase.done);
  const activePhaseIndex =
    activePhase === -1 ? project.phases.length - 1 : activePhase;

  return (
    <article
      className={`projects-lane__card${compact ? " projects-lane__card--compact" : ""}`}
      style={
        {
          "--progress": `${project.progress}%`,
          "--delay": `${index * 0.08}s`,
        } as CSSProperties
      }
    >
      <div className="projects-lane__top">
        <ProjectIcon name={project.icon} />
        <div className="projects-lane__meta mono">
          <span>{project.field}</span>
          {project.phase !== "—" ? (
            <strong>{project.phase}</strong>
          ) : (
            <strong className="projects-lane__status-badge">Devam Eden</strong>
          )}
        </div>
      </div>
      <h3>{project.title}</h3>
      <p>{project.summary}</p>

      {showPhaseSteps && (
        <ol className="projects-lane__steps" aria-label={`${project.title} proje fazları`}>
          {project.phases.map((phase, phaseIndex) => (
            <li
              className={`projects-lane__step ${phase.done ? "is-done" : ""} ${phaseIndex === activePhaseIndex ? "is-active" : ""}`}
              key={`${project.id}-${phase.label}-${phaseIndex}`}
            >
              <span className="projects-lane__step-label">{phase.label}</span>
            </li>
          ))}
        </ol>
      )}

      <div
        className="projects-lane__progress"
        aria-label={`${project.title} ilerleme oranı yüzde ${project.progress}`}
      >
        <span />
      </div>
      <div className="projects-lane__foot">
        <span className="mono">%{project.progress}</span>
        <strong>Hedef: {project.target}</strong>
      </div>

      {project.outputs.length > 0 && (
        <ul className="projects-lane__outputs">
          {project.outputs.map((output) => (
            <li key={`${project.id}-${output}`}>{output}</li>
          ))}
        </ul>
      )}

      {project.hasBody && (
        <Link to={`/projeler/${project.slug}`} className="projects-lane__detail mono">
          Detayı İncele →
        </Link>
      )}
    </article>
  );
}

function ProjectIcon({ name }: { name: ShowcaseProjectIcon }) {
  switch (name) {
    case "digital":
      return (
        <span className="projects-lane__icon" aria-hidden>
          <svg viewBox="0 0 48 48" role="img">
            <path d="M12 15.5h24v15H12z" />
            <path d="M18 36h12" />
            <path d="M24 30.5V36" />
            <path d="M17 21h14" />
            <path d="M17 25h8" />
          </svg>
        </span>
      );
    case "data":
      return (
        <span className="projects-lane__icon" aria-hidden>
          <svg viewBox="0 0 48 48" role="img">
            <path d="M13 32c0 3 5 5 11 5s11-2 11-5" />
            <path d="M13 24c0 3 5 5 11 5s11-2 11-5" />
            <path d="M13 16c0 3 5 5 11 5s11-2 11-5-5-5-11-5-11 2-11 5z" />
            <path d="M13 16v16" />
            <path d="M35 16v16" />
          </svg>
        </span>
      );
    case "lab":
      return (
        <span className="projects-lane__icon" aria-hidden>
          <svg viewBox="0 0 48 48" role="img">
            <path d="M19 10h10" />
            <path d="M21 10v11l-8 12c-1.5 2.3.1 5 2.9 5h16.2c2.8 0 4.4-2.7 2.9-5l-8-12V10" />
            <path d="M18 31h12" />
            <path d="M20 26h8" />
          </svg>
        </span>
      );
    default: {
      const exhaustive: never = name;
      return exhaustive;
    }
  }
}
