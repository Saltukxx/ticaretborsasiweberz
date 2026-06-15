import path from "node:path";
import type { Config } from "../config.js";
import { saveLocalFile } from "./localStorage.js";
import {
  createR2Client,
  publicObjectUrl,
  putPublicObject,
} from "./r2Storage.js";
import { LOCAL_STORAGE_PREFIX } from "./storageKeys.js";
import { normalizeUploadMime } from "./uploadMime.js";
import { bufferMatchesMime } from "./uploadMagic.js";

const ALLOWED_EXT = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".gif",
  ".pdf",
]);

const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
]);

function pickExtension(filename: string, mimetype: string): string | null {
  const ext = path.extname(filename).toLowerCase();
  if (ALLOWED_EXT.has(ext)) return ext;
  const fromMime: Record<string, string> = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
    "application/pdf": ".pdf",
  };
  return fromMime[mimetype] ?? null;
}

export function apiPublicBaseUrl(config: Config): string {
  return (config.baseUrl ?? "http://localhost:3001").replace(/\/$/, "");
}

export type StoredUpload = {
  publicUrl: string;
  storageKey: string;
  mimeType: string;
  serverName: string;
};

/**
 * PDF files are always stored on the API server disk (persistent volume).
 * Images use R2 when configured, otherwise local disk.
 */
export async function storeUploadedFile(
  config: Config,
  params: {
    buffer: Buffer;
    filename: string;
    mimetype: string;
    serverName: string;
  },
): Promise<StoredUpload | { ok: false; code: "INVALID_FILE" }> {
  const mimeType = normalizeUploadMime(params.filename, params.mimetype);
  if (!ALLOWED_MIME.has(mimeType)) {
    return { ok: false, code: "INVALID_FILE" };
  }

  const ext = pickExtension(params.filename, mimeType);
  if (!ext) return { ok: false, code: "INVALID_FILE" };

  if (!bufferMatchesMime(params.buffer, mimeType)) {
    return { ok: false, code: "INVALID_FILE" };
  }

  const serverName = params.serverName.endsWith(ext)
    ? params.serverName
    : `${params.serverName.replace(/\.[^.]+$/, "")}${ext}`;

  const forceLocal = mimeType === "application/pdf";

  if (forceLocal || !config.r2) {
    await saveLocalFile(config.uploadsDir, serverName, params.buffer);
    return {
      publicUrl: `${apiPublicBaseUrl(config)}/uploads/${serverName}`,
      storageKey: `${LOCAL_STORAGE_PREFIX}${serverName}`,
      mimeType,
      serverName,
    };
  }

  const key = `uploads/${serverName}`;
  const client = createR2Client(config.r2);
  await putPublicObject(
    client,
    config.r2.bucketPublic,
    key,
    params.buffer,
    mimeType,
  );
  return {
    publicUrl: publicObjectUrl(config.r2, key),
    storageKey: key,
    mimeType,
    serverName,
  };
}
