import {
  and,
  count,
  desc,
  eq,
  ilike,
  ne,
  type SQL,
} from "drizzle-orm";
import type { Database } from "../../db/connection.js";
import { admins, auditLog } from "../../db/schema/index.js";
import { hashPassword, revokeAllRefreshForAdmin } from "../auth/auth.service.js";
import type { AdminRole } from "../auth/auth.types.js";

function escapeLike(s: string): string {
  return s.replace(/[%_\\]/g, "\\$&");
}

export async function countSuperAdmins(db: Database): Promise<number> {
  const [row] = await db
    .select({ c: count() })
    .from(admins)
    .where(eq(admins.role, "super_admin"));
  return Number(row?.c ?? 0);
}

async function isOnlySuperAdmin(db: Database, id: string): Promise<boolean> {
  const [row] = await db
    .select({ role: admins.role })
    .from(admins)
    .where(eq(admins.id, id))
    .limit(1);
  if (row?.role !== "super_admin") return false;
  const n = await countSuperAdmins(db);
  return n === 1;
}

export async function listUsersAdmin(
  db: Database,
  params: {
    limit: number;
    offset: number;
    q?: string;
    active: "all" | "true" | "false";
  },
) {
  const term = params.q?.trim();
  const search: SQL | undefined = term
    ? ilike(admins.email, `%${escapeLike(term)}%`)
    : undefined;

  const activeFilter: SQL | undefined =
    params.active === "all"
      ? undefined
      : eq(admins.isActive, params.active === "true");

  const parts: SQL[] = [];
  if (search) parts.push(search);
  if (activeFilter) parts.push(activeFilter);

  const whereClause =
    parts.length === 0
      ? undefined
      : parts.length === 1
        ? parts[0]!
        : and(...parts);

  const countBase = db.select({ total: count() }).from(admins);
  const [countRow] = await (whereClause
    ? countBase.where(whereClause)
    : countBase);

  const rowsBase = db
    .select({
      id: admins.id,
      email: admins.email,
      name: admins.name,
      role: admins.role,
      isActive: admins.isActive,
      lastLoginAt: admins.lastLoginAt,
      createdAt: admins.createdAt,
      updatedAt: admins.updatedAt,
    })
    .from(admins);

  const rows = await (whereClause ? rowsBase.where(whereClause) : rowsBase)
    .orderBy(desc(admins.createdAt))
    .limit(params.limit)
    .offset(params.offset);

  return { rows, total: Number(countRow?.total ?? 0) };
}

export async function getUserByIdAdmin(db: Database, id: string) {
  const [row] = await db
    .select({
      id: admins.id,
      email: admins.email,
      name: admins.name,
      role: admins.role,
      isActive: admins.isActive,
      lastLoginAt: admins.lastLoginAt,
      createdAt: admins.createdAt,
      updatedAt: admins.updatedAt,
    })
    .from(admins)
    .where(eq(admins.id, id))
    .limit(1);
  return row ?? null;
}

export async function emailTaken(
  db: Database,
  email: string,
  excludeId?: string,
): Promise<boolean> {
  const normalized = email.trim().toLowerCase();
  const cond = excludeId
    ? and(eq(admins.email, normalized), ne(admins.id, excludeId))
    : eq(admins.email, normalized);
  const [row] = await db
    .select({ id: admins.id })
    .from(admins)
    .where(cond)
    .limit(1);
  return Boolean(row);
}

export async function createUser(
  db: Database,
  input: {
    email: string;
    password: string;
    name: string;
    role: AdminRole;
  },
): Promise<
  | { ok: true; row: NonNullable<Awaited<ReturnType<typeof getUserByIdAdmin>>> }
  | { ok: false; code: "EMAIL_TAKEN" }
> {
  const normalized = input.email.trim().toLowerCase();
  if (await emailTaken(db, normalized)) {
    return { ok: false, code: "EMAIL_TAKEN" };
  }
  const passwordHash = await hashPassword(input.password);
  const [row] = await db
    .insert(admins)
    .values({
      email: normalized,
      passwordHash,
      name: input.name,
      role: input.role,
      isActive: true,
    })
    .returning({ id: admins.id });
  if (!row) throw new Error("insert admin failed");
  const created = await getUserByIdAdmin(db, row.id);
  if (!created) throw new Error("insert admin missing");
  return { ok: true, row: created };
}

export type PatchUserInput = Partial<{
  email: string;
  name: string;
  role: AdminRole;
  isActive: boolean;
  password: string;
}>;

export async function patchUser(
  db: Database,
  id: string,
  patch: PatchUserInput,
): Promise<
  | {
      ok: true;
      row: {
        id: string;
        email: string;
        name: string;
        role: string;
        isActive: boolean;
        lastLoginAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
      };
    }
  | {
      ok: false;
      code:
        | "NOT_FOUND"
        | "EMAIL_TAKEN"
        | "LAST_SUPER_ADMIN"
        | "LAST_SUPER_ADMIN_DEACTIVATE"
        | "LAST_SUPER_ADMIN_DEMOTE";
    }
> {
  const existing = await getUserByIdAdmin(db, id);
  if (!existing) return { ok: false, code: "NOT_FOUND" };

  if (patch.email !== undefined) {
    const norm = patch.email.trim().toLowerCase();
    if (norm !== existing.email && (await emailTaken(db, norm, id))) {
      return { ok: false, code: "EMAIL_TAKEN" };
    }
  }

  if (patch.isActive === false && (await isOnlySuperAdmin(db, id))) {
    return { ok: false, code: "LAST_SUPER_ADMIN_DEACTIVATE" };
  }

  if (
    patch.role === "editor" &&
    existing.role === "super_admin" &&
    (await isOnlySuperAdmin(db, id))
  ) {
    return { ok: false, code: "LAST_SUPER_ADMIN_DEMOTE" };
  }

  let passwordHash: string | undefined;
  if (patch.password !== undefined) {
    passwordHash = await hashPassword(patch.password);
  }

  const [row] = await db
    .update(admins)
    .set({
      ...(patch.email !== undefined
        ? { email: patch.email.trim().toLowerCase() }
        : {}),
      ...(patch.name !== undefined ? { name: patch.name } : {}),
      ...(patch.role !== undefined ? { role: patch.role } : {}),
      ...(patch.isActive !== undefined ? { isActive: patch.isActive } : {}),
      ...(passwordHash !== undefined ? { passwordHash } : {}),
      updatedAt: new Date(),
    })
    .where(eq(admins.id, id))
    .returning({
      id: admins.id,
      email: admins.email,
      name: admins.name,
      role: admins.role,
      isActive: admins.isActive,
      lastLoginAt: admins.lastLoginAt,
      createdAt: admins.createdAt,
      updatedAt: admins.updatedAt,
    });

  if (!row) return { ok: false, code: "NOT_FOUND" };

  if (
    patch.password !== undefined ||
    patch.role !== undefined ||
    patch.isActive !== undefined
  ) {
    await revokeAllRefreshForAdmin(db, id);
  }

  return { ok: true, row };
}

export async function deleteUser(
  db: Database,
  id: string,
  actorId: string,
): Promise<
  | { ok: true }
  | {
      ok: false;
      code:
        | "NOT_FOUND"
        | "SELF_DELETE"
        | "LAST_SUPER_ADMIN";
    }
> {
  if (id === actorId) return { ok: false, code: "SELF_DELETE" };

  const existing = await getUserByIdAdmin(db, id);
  if (!existing) return { ok: false, code: "NOT_FOUND" };

  if (existing.role === "super_admin" && (await isOnlySuperAdmin(db, id))) {
    return { ok: false, code: "LAST_SUPER_ADMIN" };
  }

  await revokeAllRefreshForAdmin(db, id);

  await db
    .update(auditLog)
    .set({ adminId: null })
    .where(eq(auditLog.adminId, id));

  await db.delete(admins).where(eq(admins.id, id));
  return { ok: true };
}
