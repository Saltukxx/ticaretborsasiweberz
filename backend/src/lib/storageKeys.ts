import path from "node:path";

/** Prefix for files stored on the API server's local disk (see UPLOADS_DIR). */
export const LOCAL_STORAGE_PREFIX = "local:" as const;

export function isLocalStorageKey(storageKey: string): boolean {
  return storageKey.startsWith(LOCAL_STORAGE_PREFIX);
}

export function localFilenameFromKey(storageKey: string): string {
  return storageKey.slice(LOCAL_STORAGE_PREFIX.length);
}

/** Reject path traversal in upload filenames / storage keys. */
export function isSafeUploadFilename(filename: string): boolean {
  if (!filename || filename.includes("..") || /[/\\]/.test(filename)) {
    return false;
  }
  return path.basename(filename) === filename;
}

/** Resolve a filename under uploadsDir; returns null if outside the directory. */
export function resolveSafeUploadPath(
  uploadsDir: string,
  filename: string,
): string | null {
  if (!isSafeUploadFilename(filename)) return null;
  const resolved = path.resolve(uploadsDir, filename);
  const base = path.resolve(uploadsDir);
  if (!resolved.startsWith(base + path.sep) && resolved !== base) {
    return null;
  }
  return resolved;
}
