import { randomUUID } from "node:crypto";
import {
  and,
  count,
  desc,
  eq,
  ilike,
  or,
  type SQL,
} from "drizzle-orm";
import type { Database } from "../../db/connection.js";
import { media } from "../../db/schema/index.js";
import type { Config } from "../../config.js";
import { deleteLocalFile } from "../../lib/localStorage.js";
import { createR2Client, deletePublicObject } from "../../lib/r2Storage.js";
import { storeUploadedFile } from "../../lib/storeUploadedFile.js";
import {
  isLocalStorageKey,
  localFilenameFromKey,
} from "../../lib/storageKeys.js";

function escapeLike(s: string): string {
  return s.replace(/[%_\\]/g, "\\$&");
}

function isForeignKeyViolation(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code?: string }).code === "23503"
  );
}

// ---------------------------------------------------------------------------
// List
// ---------------------------------------------------------------------------

export async function listMediaAdmin(
  db: Database,
  params: {
    limit: number;
    offset: number;
    q?: string;
    mimePrefix?: string;
  },
) {
  const term = params.q?.trim();
  const search: SQL | undefined = term
    ? or(
        ilike(media.filename, `%${escapeLike(term)}%`),
        ilike(media.originalName, `%${escapeLike(term)}%`),
      ) as SQL
    : undefined;
  const mimeFilter: SQL | undefined = params.mimePrefix
    ? ilike(media.mimeType, `${escapeLike(params.mimePrefix)}%`)
    : undefined;

  const parts: SQL[] = [];
  if (search) parts.push(search);
  if (mimeFilter) parts.push(mimeFilter);
  const whereClause =
    parts.length === 0
      ? undefined
      : parts.length === 1
        ? parts[0]!
        : and(...parts);

  const countBase = db.select({ total: count() }).from(media);
  const [countRow] = await (whereClause
    ? countBase.where(whereClause)
    : countBase);

  const rows = await db
    .select()
    .from(media)
    .where(whereClause)
    .orderBy(desc(media.createdAt))
    .limit(params.limit)
    .offset(params.offset);

  return { rows, total: Number(countRow?.total ?? 0) };
}

// ---------------------------------------------------------------------------
// Get one
// ---------------------------------------------------------------------------

export async function getMediaById(db: Database, id: string) {
  const [row] = await db
    .select()
    .from(media)
    .where(eq(media.id, id))
    .limit(1);
  return row ?? null;
}

// ---------------------------------------------------------------------------
// Upload — R2 when configured, local disk otherwise
// ---------------------------------------------------------------------------

export async function uploadMediaPublic(
  db: Database,
  config: Config,
  params: {
    buffer: Buffer;
    filename: string;
    mimetype: string;
    adminId: string;
  },
): Promise<
  | { ok: true; row: typeof media.$inferSelect }
  | { ok: false; code: "INVALID_FILE" }
> {
  const id = randomUUID();
  const stored = await storeUploadedFile(config, {
    buffer: params.buffer,
    filename: params.filename,
    mimetype: params.mimetype,
    serverName: id,
  });
  if ("code" in stored) {
    return { ok: false, code: stored.code };
  }

  const [row] = await db
    .insert(media)
    .values({
      filename: stored.serverName,
      originalName: params.filename.slice(0, 500),
      mimeType: stored.mimeType.slice(0, 100),
      sizeBytes: params.buffer.length,
      storageKey: stored.storageKey,
      publicUrl: stored.publicUrl,
      uploadedBy: params.adminId,
    })
    .returning();

  if (!row) throw new Error("insert media failed");
  return { ok: true, row };
}

// ---------------------------------------------------------------------------
// Patch alt text
// ---------------------------------------------------------------------------

export async function patchMediaAlt(
  db: Database,
  id: string,
  altText: string | null,
) {
  const existing = await getMediaById(db, id);
  if (!existing) return { ok: false as const, code: "NOT_FOUND" as const };

  const [row] = await db
    .update(media)
    .set({
      altText: altText === null ? null : altText.slice(0, 500),
    })
    .where(eq(media.id, id))
    .returning();

  if (!row) return { ok: false as const, code: "NOT_FOUND" as const };
  return { ok: true as const, row };
}

// ---------------------------------------------------------------------------
// Delete — works for both R2 and local-stored files
// ---------------------------------------------------------------------------

export async function deleteMediaRow(
  db: Database,
  config: Config,
  id: string,
): Promise<
  | { ok: true }
  | { ok: false; code: "NOT_FOUND" | "IN_USE" }
> {
  const row = await getMediaById(db, id);
  if (!row) return { ok: false, code: "NOT_FOUND" };

  // Remove DB record first so FK violations surface before file deletion.
  try {
    await db.delete(media).where(eq(media.id, id));
  } catch (e: unknown) {
    if (isForeignKeyViolation(e)) {
      return { ok: false, code: "IN_USE" };
    }
    throw e;
  }

  // Best-effort file deletion — don't fail the request if storage cleanup fails.
  try {
    if (isLocalStorageKey(row.storageKey)) {
      const filename = localFilenameFromKey(row.storageKey);
      await deleteLocalFile(config.uploadsDir, filename);
    } else if (config.r2) {
      // R2
      const client = createR2Client(config.r2);
      await deletePublicObject(client, config.r2.bucketPublic, row.storageKey);
    }
    // else: R2 key but R2 not configured → orphan object, acceptable trade-off
  } catch {
    // Log but don't surface — DB record is already gone.
    console.warn(`[media] Failed to delete storage object for id=${id}`);
  }

  return { ok: true };
}
