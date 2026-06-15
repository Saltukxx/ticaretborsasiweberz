import { asc, eq } from "drizzle-orm";
import type { Database } from "../../db/connection.js";
import {
  CORPORATE_DOCUMENT_CATEGORIES,
  corporateDocuments,
  type CorporateDocumentCategory,
} from "../../db/schema/corporate.js";
import { sanitizeRichHtml } from "../../lib/sanitizeHtml.js";

function stripUndefined<T extends Record<string, unknown>>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined),
  ) as Partial<T>;
}

export async function listCorporateDocumentsAdmin(db: Database) {
  return db
    .select()
    .from(corporateDocuments)
    .orderBy(asc(corporateDocuments.sortOrder), asc(corporateDocuments.title));
}

export async function getCorporateDocumentByIdAdmin(db: Database, id: string) {
  const [row] = await db
    .select()
    .from(corporateDocuments)
    .where(eq(corporateDocuments.id, id))
    .limit(1);
  return row ?? null;
}

export async function patchCorporateDocumentAdmin(
  db: Database,
  id: string,
  patch: {
    title?: string;
    summary?: string | null;
    body?: string | null;
    category?: CorporateDocumentCategory;
    sortOrder?: number;
    isPublished?: boolean;
  },
) {
  const existing = await getCorporateDocumentByIdAdmin(db, id);
  if (!existing) return { ok: false as const, error: "NOT_FOUND" as const };

  if (
    patch.category !== undefined &&
    !CORPORATE_DOCUMENT_CATEGORIES.includes(patch.category)
  ) {
    return { ok: false as const, error: "INVALID_CATEGORY" as const };
  }

  const values = stripUndefined({
    title: patch.title,
    summary: patch.summary,
    body:
      patch.body === undefined
        ? undefined
        : patch.body === null
          ? null
          : sanitizeRichHtml(patch.body),
    category: patch.category,
    sortOrder: patch.sortOrder,
    isPublished: patch.isPublished,
    updatedAt: new Date(),
  });

  const [row] = await db
    .update(corporateDocuments)
    .set(values)
    .where(eq(corporateDocuments.id, id))
    .returning();

  return { ok: true as const, row: row! };
}
