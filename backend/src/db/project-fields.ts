export type ProjectPhase = {
  label: string;
  done: boolean;
};

export type ProjectMetric = {
  value: string;
  label: string;
};

export type ProjectIcon = "digital" | "data" | "lab";

export type ProjectStatus = "ongoing" | "completed";
