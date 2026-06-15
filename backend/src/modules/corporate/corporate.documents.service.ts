import { and, asc, eq } from "drizzle-orm";
import type { FastifyReply } from "fastify";
import type { Config } from "../../config.js";
import type { Database } from "../../db/connection.js";
import { corporateDocuments, media } from "../../db/schema/index.js";
import { sendPdfFromStorage } from "../../lib/sendPdfFile.js";

export async function listPublishedCorporateDocuments(db: Database) {
  return db
    .select({
      id: corporateDocuments.id,
      slug: corporateDocuments.slug,
      title: corporateDocuments.title,
      summary: corporateDocuments.summary,
      category: corporateDocuments.category,
      sortOrder: corporateDocuments.sortOrder,
    })
    .from(corporateDocuments)
    .where(eq(corporateDocuments.isPublished, true))
    .orderBy(asc(corporateDocuments.sortOrder), asc(corporateDocuments.title));
}

export async function getPublishedCorporateDocument(db: Database, slug: string) {
  const [row] = await db
    .select({
      id: corporateDocuments.id,
      slug: corporateDocuments.slug,
      title: corporateDocuments.title,
      summary: corporateDocuments.summary,
      body: corporateDocuments.body,
      category: corporateDocuments.category,
      sortOrder: corporateDocuments.sortOrder,
      fileId: corporateDocuments.fileId,
      fileUrl: media.publicUrl,
      fileMimeType: media.mimeType,
      fileOriginalName: media.originalName,
    })
    .from(corporateDocuments)
    .innerJoin(media, eq(corporateDocuments.fileId, media.id))
    .where(
      and(
        eq(corporateDocuments.isPublished, true),
        eq(corporateDocuments.slug, slug),
      ),
    )
    .limit(1);
  return row ?? null;
}

async function getPublishedCorporateDocumentFile(db: Database, slug: string) {
  const [row] = await db
    .select({
      originalName: media.originalName,
      storageKey: media.storageKey,
      publicUrl: media.publicUrl,
    })
    .from(corporateDocuments)
    .innerJoin(media, eq(corporateDocuments.fileId, media.id))
    .where(
      and(
        eq(corporateDocuments.isPublished, true),
        eq(corporateDocuments.slug, slug),
      ),
    )
    .limit(1);
  return row ?? null;
}

export async function sendCorporateDocumentDownload(
  db: Database,
  config: Config,
  slug: string,
  reply: FastifyReply,
  options?: { inline?: boolean },
): Promise<FastifyReply> {
  const file = await getPublishedCorporateDocumentFile(db, slug);
  if (!file) {
    return reply.status(404).send({
      error: { code: "NOT_FOUND", message: "Belge bulunamadı." },
    });
  }
  return sendPdfFromStorage(config, reply, file, { inline: options?.inline });
}
