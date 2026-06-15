import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";
import type { FastifyReply } from "fastify";
import type { Config } from "../config.js";
import { readLocalFile } from "./localStorage.js";
import {
  createR2Client,
  getPublicObjectBuffer,
} from "./r2Storage.js";
import {
  isLocalStorageKey,
  isSafeUploadFilename,
  localFilenameFromKey,
  resolveSafeUploadPath,
} from "./storageKeys.js";

/** Resolve on-disk filename for local and legacy media rows. */
function resolveDiskFilename(file: {
  storageKey: string;
  publicUrl: string;
}): string | null {
  if (isLocalStorageKey(file.storageKey)) {
    const name = localFilenameFromKey(file.storageKey);
    return isSafeUploadFilename(name) ? name : null;
  }
  const fromKey = path.basename(file.storageKey);
  if (fromKey.endsWith(".pdf") && isSafeUploadFilename(fromKey)) return fromKey;
  try {
    const fromUrl = path.basename(new URL(file.publicUrl).pathname);
    if (fromUrl.endsWith(".pdf") && isSafeUploadFilename(fromUrl)) return fromUrl;
  } catch {
    // ignore
  }
  return null;
}

async function sendLocalPdf(
  config: Config,
  reply: FastifyReply,
  filename: string,
): Promise<FastifyReply | null> {
  const filePath = resolveSafeUploadPath(config.uploadsDir, filename);
  if (!filePath) return null;
  try {
    const info = await stat(filePath);
    void reply.header("Content-Length", info.size);
    return reply.send(createReadStream(filePath));
  } catch {
    try {
      const buffer = await readLocalFile(config.uploadsDir, filename);
      void reply.header("Content-Length", buffer.length);
      return reply.send(buffer);
    } catch {
      return null;
    }
  }
}

export function pdfContentDisposition(originalName: string): string {
  const base = originalName.trim() || "rapor.pdf";
  const ascii = base.replace(/[^\w.\-() ]+/g, "_").slice(0, 180) || "rapor.pdf";
  const encoded = encodeURIComponent(base);
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encoded}`;
}

export async function sendPdfFromStorage(
  config: Config,
  reply: FastifyReply,
  file: {
    originalName: string;
    storageKey: string;
    publicUrl: string;
  },
  options?: { inline?: boolean },
): Promise<FastifyReply> {
  const disposition = options?.inline
    ? "inline"
    : pdfContentDisposition(file.originalName);

  void reply.header("Content-Type", "application/pdf");
  void reply.header("Content-Disposition", disposition);
  void reply.header("Cache-Control", "private, max-age=3600");
  void reply.header("X-Content-Type-Options", "nosniff");

  const diskFilename = resolveDiskFilename(file);
  if (diskFilename) {
    const sent = await sendLocalPdf(config, reply, diskFilename);
    if (sent) return sent;
    return reply.status(404).send({
      error: { code: "FILE_NOT_FOUND", message: "PDF dosyası sunucuda bulunamadı." },
    });
  }

  if (config.r2) {
    try {
      const client = createR2Client(config.r2);
      const buffer = await getPublicObjectBuffer(
        client,
        config.r2.bucketPublic,
        file.storageKey,
      );
      void reply.header("Content-Length", buffer.length);
      return reply.send(buffer);
    } catch {
      // Legacy rows may point at CDN URL
    }
  }

  return reply.status(404).send({
    error: {
      code: "FILE_NOT_FOUND",
      message: "PDF dosyası bulunamadı. Lütfen raporu yeniden yükleyin.",
    },
  });
}
