import { readFile } from "node:fs/promises";
import path from "node:path";
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

function resolveDiskFilename(file: {
  storageKey: string;
  publicUrl: string;
}): string | null {
  if (isLocalStorageKey(file.storageKey)) {
    const name = localFilenameFromKey(file.storageKey);
    return isSafeUploadFilename(name) ? name : null;
  }
  const fromKey = path.basename(file.storageKey);
  if (isSafeUploadFilename(fromKey)) return fromKey;
  try {
    const fromUrl = path.basename(new URL(file.publicUrl).pathname);
    if (isSafeUploadFilename(fromUrl)) return fromUrl;
  } catch {
    // ignore
  }
  return null;
}

/** Read a media file from local disk or R2 into a buffer. */
export async function readMediaBuffer(
  config: Config,
  file: {
    storageKey: string;
    publicUrl: string;
  },
): Promise<Buffer | null> {
  const diskFilename = resolveDiskFilename(file);
  if (diskFilename) {
    const filePath = resolveSafeUploadPath(config.uploadsDir, diskFilename);
    if (filePath) {
      try {
        return await readFile(filePath);
      } catch {
        try {
          return await readLocalFile(config.uploadsDir, diskFilename);
        } catch {
          return null;
        }
      }
    }
  }

  if (config.r2) {
    try {
      const client = createR2Client(config.r2);
      return await getPublicObjectBuffer(
        client,
        config.r2.bucketPublic,
        file.storageKey,
      );
    } catch {
      return null;
    }
  }

  return null;
}
