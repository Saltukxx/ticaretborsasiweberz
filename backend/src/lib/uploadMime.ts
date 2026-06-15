import path from "node:path";

const GENERIC_BINARY = new Set([
  "application/octet-stream",
  "binary/octet-stream",
  "",
]);

/**
 * Browsers often send application/octet-stream for PDFs; infer from extension.
 */
export function normalizeUploadMime(filename: string, mimetype: string): string {
  const ext = path.extname(filename).toLowerCase();
  const mt = mimetype.toLowerCase().split(";")[0]!.trim();

  if (ext === ".pdf" && GENERIC_BINARY.has(mt)) {
    return "application/pdf";
  }
  if ((ext === ".jpg" || ext === ".jpeg") && GENERIC_BINARY.has(mt)) {
    return "image/jpeg";
  }
  if (ext === ".png" && GENERIC_BINARY.has(mt)) {
    return "image/png";
  }
  if (ext === ".webp" && GENERIC_BINARY.has(mt)) {
    return "image/webp";
  }
  if (ext === ".gif" && GENERIC_BINARY.has(mt)) {
    return "image/gif";
  }
  return mt;
}
