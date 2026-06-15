import { isoDateToday } from "../databankSync/normalize.js";
import { fetchExternalSourceRows } from "./fetchers.js";
import {
  EXTERNAL_BULLETIN_SOURCES,
  getExternalSource,
} from "./sources.js";
import type {
  ExternalBulletinSourceResult,
  ExternalBulletinsPayload,
} from "./types.js";

function sourceMeta(source: (typeof EXTERNAL_BULLETIN_SOURCES)[number]) {
  return {
    id: source.id,
    name: source.name,
    shortName: source.shortName,
    sourceUrl: source.sourceUrl,
  };
}

export async function fetchOneExternalBulletin(
  sourceId: string,
  sessionDate = isoDateToday(),
): Promise<ExternalBulletinSourceResult> {
  const source = getExternalSource(sourceId);
  const fetchedAt = new Date().toISOString();
  if (!source) {
    return {
      id: sourceId,
      name: sourceId,
      shortName: sourceId,
      sourceUrl: "",
      sessionDate,
      fetchedAt,
      status: "error",
      errorMessage: "Bilinmeyen kaynak",
      rows: [],
    };
  }

  try {
    const rows = await fetchExternalSourceRows(source, sessionDate);
    return {
      ...sourceMeta(source),
      sessionDate,
      fetchedAt,
      status: "ok",
      rows,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Kaynak alınamadı";
    return {
      ...sourceMeta(source),
      sessionDate,
      fetchedAt,
      status: "error",
      errorMessage: message,
      rows: [],
    };
  }
}

export async function fetchAllExternalBulletins(
  sessionDate = isoDateToday(),
): Promise<ExternalBulletinsPayload> {
  const fetchedAt = new Date().toISOString();
  const results = await Promise.all(
    EXTERNAL_BULLETIN_SOURCES.map(async (source) => {
      try {
        const rows = await fetchExternalSourceRows(source, sessionDate);
        return {
          ...sourceMeta(source),
          sessionDate,
          fetchedAt,
          status: "ok" as const,
          rows,
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Kaynak alınamadı";
        return {
          ...sourceMeta(source),
          sessionDate,
          fetchedAt,
          status: "error" as const,
          errorMessage: message,
          rows: [],
        };
      }
    }),
  );

  return {
    fetchedAt,
    sessionDate,
    sources: results,
  };
}
