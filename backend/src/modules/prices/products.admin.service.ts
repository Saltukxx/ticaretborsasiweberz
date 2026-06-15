import { and, asc, eq, ilike, type SQL } from "drizzle-orm";
import type { Database } from "../../db/connection.js";
import { commodityProducts } from "../../db/schema/index.js";
import { isValidSlug } from "../../lib/slug.js";

function escapeLike(s: string): string {
  return s.replace(/[%_\\]/g, "\\$&");
}

export async function listProductsAdmin(
  db: Database,
  params: { q?: string; activeOnly?: boolean },
) {
  const parts: SQL[] = [];
  if (params.q?.trim()) {
    parts.push(ilike(commodityProducts.name, `%${escapeLike(params.q.trim())}%`));
  }
  if (params.activeOnly) {
    parts.push(eq(commodityProducts.isActive, true));
  }
  const whereClause =
    parts.length > 0 ? and(...parts) : undefined;

  const base = db.select().from(commodityProducts);
  const rows = await (whereClause
    ? base.where(whereClause)
    : base
  ).orderBy(asc(commodityProducts.sortOrder), asc(commodityProducts.name));

  return rows;
}

export async function getProductById(db: Database, id: string) {
  const [row] = await db
    .select()
    .from(commodityProducts)
    .where(eq(commodityProducts.id, id))
    .limit(1);
  return row ?? null;
}

export async function getProductBySlug(db: Database, slug: string) {
  const [row] = await db
    .select()
    .from(commodityProducts)
    .where(eq(commodityProducts.slug, slug))
    .limit(1);
  return row ?? null;
}

export async function createProduct(
  db: Database,
  input: {
    slug: string;
    name: string;
    category: string;
    unit: string;
    isActive?: boolean;
    sortOrder?: number;
  },
): Promise<
  | { ok: true; row: typeof commodityProducts.$inferSelect }
  | { ok: false; code: "INVALID_SLUG" | "SLUG_TAKEN" }
> {
  if (!isValidSlug(input.slug)) return { ok: false, code: "INVALID_SLUG" };
  if (await getProductBySlug(db, input.slug)) {
    return { ok: false, code: "SLUG_TAKEN" };
  }

  const [row] = await db
    .insert(commodityProducts)
    .values({
      slug: input.slug,
      name: input.name,
      category: input.category,
      unit: input.unit,
      isActive: input.isActive ?? true,
      sortOrder: input.sortOrder ?? 0,
    })
    .returning();

  if (!row) throw new Error("insert product failed");
  return { ok: true, row };
}

export async function patchProduct(
  db: Database,
  id: string,
  patch: {
    slug?: string;
    name?: string;
    category?: string;
    unit?: string;
    isActive?: boolean;
    sortOrder?: number;
  },
): Promise<
  | { ok: true; row: typeof commodityProducts.$inferSelect }
  | { ok: false; code: "NOT_FOUND" | "INVALID_SLUG" | "SLUG_TAKEN" }
> {
  const existing = await getProductById(db, id);
  if (!existing) return { ok: false, code: "NOT_FOUND" };

  if (patch.slug !== undefined) {
    if (!isValidSlug(patch.slug)) return { ok: false, code: "INVALID_SLUG" };
    if (patch.slug !== existing.slug) {
      const taken = await getProductBySlug(db, patch.slug);
      if (taken && taken.id !== id) return { ok: false, code: "SLUG_TAKEN" };
    }
  }

  const cleaned = Object.fromEntries(
    Object.entries(patch).filter(([, v]) => v !== undefined),
  ) as Partial<typeof commodityProducts.$inferInsert>;

  const [row] = await db
    .update(commodityProducts)
    .set({
      ...cleaned,
      updatedAt: new Date(),
    })
    .where(eq(commodityProducts.id, id))
    .returning();

  if (!row) return { ok: false, code: "NOT_FOUND" };
  return { ok: true, row };
}
