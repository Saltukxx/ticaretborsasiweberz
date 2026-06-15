import { apiRequest } from "./http";

export type DatabankSyncRun = {
  id: string;
  status: string;
  sections: string[];
  startedAt: string;
  finishedAt: string | null;
  groupsProcessed: number | null;
  rowsUpserted: number | null;
  chartsProcessed: number | null;
  errorMessage: string | null;
};

export async function listDatabankSyncRuns() {
  return apiRequest<{ data: DatabankSyncRun[] }>(
    "/api/v1/admin/sync/databank/runs",
  );
}

export async function triggerDatabankSync(body?: {
  sections?: ("home" | "tescil" | "charts" | "volume")[];
  dryRun?: boolean;
}) {
  return apiRequest<{
    data: {
      runId: string;
      status: string;
      rowsUpserted: number;
      chartsProcessed: number;
      groupsProcessed: number;
      errorMessage?: string;
    };
  }>("/api/v1/admin/sync/databank/trigger", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body ?? {}),
  });
}
