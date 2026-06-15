import { and, asc, eq } from "drizzle-orm";
import type { Database } from "../../db/connection.js";
import { serviceAgreements } from "../../db/schema/index.js";

export async function listPublishedServiceAgreements(db: Database) {
  return db
    .select({
      id: serviceAgreements.id,
      slug: serviceAgreements.slug,
      title: serviceAgreements.title,
      summary: serviceAgreements.summary,
      category: serviceAgreements.category,
      sortOrder: serviceAgreements.sortOrder,
    })
    .from(serviceAgreements)
    .where(eq(serviceAgreements.isPublished, true))
    .orderBy(asc(serviceAgreements.sortOrder), asc(serviceAgreements.title));
}

export async function getPublishedServiceAgreement(db: Database, slug: string) {
  const [row] = await db
    .select({
      id: serviceAgreements.id,
      slug: serviceAgreements.slug,
      title: serviceAgreements.title,
      summary: serviceAgreements.summary,
      body: serviceAgreements.body,
      category: serviceAgreements.category,
      sortOrder: serviceAgreements.sortOrder,
    })
    .from(serviceAgreements)
    .where(
      and(
        eq(serviceAgreements.isPublished, true),
        eq(serviceAgreements.slug, slug),
      ),
    )
    .limit(1);
  return row ?? null;
}
