import fs from "node:fs/promises";
import path from "node:path";

/**
 * Save a file buffer to the local uploads directory.
 * Creates the directory if it does not exist.
 */
export async function readLocalFile(
  uploadsDir: string,
  filename: string,
): Promise<Buffer> {
  return fs.readFile(path.join(uploadsDir, filename));
}

export async function saveLocalFile(
  uploadsDir: string,
  filename: string,
  buffer: Buffer,
): Promise<void> {
  await fs.mkdir(uploadsDir, { recursive: true });
  await fs.writeFile(path.join(uploadsDir, filename), buffer);
}

/**
 * Delete a file from the local uploads directory.
 * Silently ignores ENOENT (already deleted).
 */
export async function deleteLocalFile(
  uploadsDir: string,
  filename: string,
): Promise<void> {
  try {
    await fs.unlink(path.join(uploadsDir, filename));
  } catch (err: unknown) {
    if (
      typeof err === "object" &&
      err !== null &&
      (err as { code?: string }).code === "ENOENT"
    ) {
      return; // already gone — not an error
    }
    throw err;
  }
}
