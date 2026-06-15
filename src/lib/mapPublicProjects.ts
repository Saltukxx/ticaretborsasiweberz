import type { PublicProject, ProjectIcon } from "./publicApi";

export type ShowcaseProjectIcon = "digital" | "data" | "lab";

export interface ShowcaseOngoingProject {
  id: string;
  slug: string;
  hasBody: boolean;
  title: string;
  field: string;
  summary: string;
  progress: number;
  target: string;
  phase: string;
  phases: { label: string; done: boolean }[];
  icon: ShowcaseProjectIcon;
  outputs: string[];
}

export interface ShowcaseCompletedProject {
  id: string;
  slug: string;
  hasBody: boolean;
  title: string;
  field: string;
  summary: string;
  year: string;
  impact: string;
  result: string;
  metric: { value: string; label: string };
}

const DEFAULT_PHASES = [
  { label: "Hazırlık", done: false },
  { label: "Tasarım", done: false },
  { label: "Pilot", done: false },
  { label: "Yayım", done: false },
];

const DEFAULT_PHASE_LABELS = DEFAULT_PHASES.map((p) => p.label).join("|");

/** Admin'den özelleştirilmiş faz/ilerleme verisi var mı? Varsayılan şablonu gizler. */
export function hasMeaningfulTracking(project: ShowcaseOngoingProject): boolean {
  if (project.progress > 0) return true;
  if (project.phase !== "—") return true;
  if (project.target !== "—") return true;
  if (project.phases.some((p) => p.done)) return true;
  const labels = project.phases.map((p) => p.label).join("|");
  return labels !== DEFAULT_PHASE_LABELS;
}

const ICONS: ShowcaseProjectIcon[] = ["digital", "data", "lab"];

function normalizeIcon(icon: ProjectIcon | null): ShowcaseProjectIcon {
  if (icon && ICONS.includes(icon as ShowcaseProjectIcon)) {
    return icon as ShowcaseProjectIcon;
  }
  return "digital";
}

export function mapPublicProjectToOngoing(p: PublicProject): ShowcaseOngoingProject {
  return {
    id: p.id,
    slug: p.slug,
    hasBody: Boolean(p.hasBody),
    title: p.title,
    field: p.field?.trim() || "Genel",
    summary: p.description?.trim() || "",
    progress: Math.min(100, Math.max(0, p.progress ?? 0)),
    target: p.targetLabel?.trim() || "—",
    phase: p.phaseLabel?.trim() || "—",
    phases: p.phases?.length ? p.phases : DEFAULT_PHASES,
    icon: normalizeIcon(p.icon),
    outputs: p.outputs?.filter(Boolean) ?? [],
  };
}

export function mapPublicProjectToCompleted(p: PublicProject): ShowcaseCompletedProject {
  const year =
    p.year?.trim() ||
    (p.completedAt ? String(new Date(p.completedAt).getFullYear()) : "—");

  return {
    id: p.id,
    slug: p.slug,
    hasBody: Boolean(p.hasBody),
    title: p.title,
    field: p.field?.trim() || "Genel",
    summary: p.description?.trim() || "",
    year,
    impact: p.impact?.trim() || "—",
    result: p.result?.trim() || "",
    metric: p.metric ?? { value: "—", label: "" },
  };
}

export function splitShowcaseProjects(all: PublicProject[]) {
  const ongoing: ShowcaseOngoingProject[] = [];
  const completed: ShowcaseCompletedProject[] = [];

  for (const row of all) {
    if (row.status === "completed") {
      completed.push(mapPublicProjectToCompleted(row));
    } else {
      ongoing.push(mapPublicProjectToOngoing(row));
    }
  }

  return { ongoing, completed };
}

export function uniqueFocusAreas(all: PublicProject[]): string[] {
  const seen = new Set<string>();
  const areas: string[] = [];
  for (const row of all) {
    const field = row.field?.trim();
    if (!field || seen.has(field)) continue;
    seen.add(field);
    areas.push(field);
  }
  return areas;
}
