import { eq } from "drizzle-orm";
import type { Database } from "../db/connection.js";
import { media } from "../db/schema/index.js";

export async function mediaExists(db: Database, id: string): Promise<boolean> {
  const [row] = await db
    .select({ id: media.id })
    .from(media)
    .where(eq(media.id, id))
    .limit(1);
  return Boolean(row);
}

export async function pdfMediaExists(db: Database, id: string): Promise<boolean> {
  const [row] = await db
    .select({ mimeType: media.mimeType })
    .from(media)
    .where(eq(media.id, id))
    .limit(1);
  return row?.mimeType === "application/pdf";
}
