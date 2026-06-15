import { and, eq, isNull } from "drizzle-orm";
import type { Database } from "../../db/connection.js";
import { media, reports } from "../../db/schema/index.js";

export async function getPublishedReportFile(db: Database, slug: string) {
  const [row] = await db
    .select({
      originalName: media.originalName,
      storageKey: media.storageKey,
      publicUrl: media.publicUrl,
      mimeType: media.mimeType,
    })
    .from(reports)
    .innerJoin(media, eq(reports.fileId, media.id))
    .where(
      and(
        isNull(reports.deletedAt),
        eq(reports.isPublished, true),
        eq(reports.slug, slug),
      ),
    )
    .limit(1);

  if (!row || row.mimeType !== "application/pdf") return null;
  return row;
}
