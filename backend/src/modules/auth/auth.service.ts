import bcrypt from "bcryptjs";
import { and, eq, isNull } from "drizzle-orm";
import type { RedisClient } from "../../lib/redis.js";
import type { Config } from "../../config.js";
import type { Database } from "../../db/connection.js";
import { admins, refreshTokens } from "../../db/schema/index.js";
import { hashToken, randomRefreshToken, signAccessToken } from "./auth.tokens.js";
import type { AdminRole } from "./auth.types.js";

const BCRYPT_ROUNDS = 12;
const LOGIN_FAIL_MAX = 5;
const LOGIN_FAIL_WINDOW_SEC = 15 * 60;
const LOGIN_LOCK_SEC = 15 * 60;

/** Dummy bcrypt hash for constant-time login when the account is missing/inactive. */
const DUMMY_PASSWORD_HASH =
  "$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW";

function loginFailKey(prefix: string, ip: string): string {
  return `${prefix}login:fail:${ip}`;
}

function loginLockKey(prefix: string, ip: string): string {
  return `${prefix}login:lock:${ip}`;
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export type LoginResult =
  | {
      ok: true;
      accessToken: string;
      refreshRaw: string;
      admin: {
        id: string;
        email: string;
        name: string;
        role: AdminRole;
      };
    }
  | { ok: false; reason: "invalid_credentials" | "locked" | "inactive" };

export async function loginAdmin(
  db: Database,
  redis: RedisClient | null,
  config: Config,
  params: {
    email: string;
    password: string;
    ip: string;
    userAgent: string | undefined;
  },
): Promise<LoginResult> {
  const prefix = config.redisPrefix;
  const lockKey = loginLockKey(prefix, params.ip);

  if (redis) {
    const locked = await redis.get(lockKey);
    if (locked) {
      return { ok: false, reason: "locked" };
    }
  }

  const normalizedEmail = params.email.trim().toLowerCase();
  const [row] = await db
    .select()
    .from(admins)
    .where(eq(admins.email, normalizedEmail))
    .limit(1);

  const hashToCheck =
    row && row.isActive ? row.passwordHash : DUMMY_PASSWORD_HASH;
  const passwordOk =
    row &&
    row.isActive &&
    (await verifyPassword(params.password, hashToCheck));

  if (!passwordOk || !row || !row.isActive) {
    if (redis) {
      const fk = loginFailKey(prefix, params.ip);
      const n = await redis.incr(fk);
      if (n === 1) await redis.expire(fk, LOGIN_FAIL_WINDOW_SEC);
      if (n >= LOGIN_FAIL_MAX) {
        await redis.set(lockKey, "1", "EX", LOGIN_LOCK_SEC);
        await redis.del(fk);
      }
    }
    return { ok: false, reason: "invalid_credentials" };
  }

  if (redis) {
    await redis.del(loginFailKey(prefix, params.ip));
  }

  const { raw, hash } = randomRefreshToken();
  const expiresAt = new Date(
    Date.now() + config.jwtRefreshTtl * 1000,
  );

  await db.insert(refreshTokens).values({
    adminId: row.id,
    tokenHash: hash,
    expiresAt,
    ipAddress: params.ip || null,
    userAgent: params.userAgent ?? null,
  });

  await db
    .update(admins)
    .set({ lastLoginAt: new Date(), updatedAt: new Date() })
    .where(eq(admins.id, row.id));

  const role = row.role as AdminRole;
  const accessToken = signAccessToken(config, row.id, role);

  return {
    ok: true,
    accessToken,
    refreshRaw: raw,
    admin: {
      id: row.id,
      email: row.email,
      name: row.name,
      role,
    },
  };
}

export async function rotateRefreshToken(
  db: Database,
  config: Config,
  params: {
    refreshRaw: string;
    ip: string;
    userAgent: string | undefined;
  },
): Promise<
  | { ok: true; accessToken: string; refreshRaw: string; adminId: string; role: AdminRole }
  | { ok: false }
> {
  const hash = hashToken(params.refreshRaw);
  const [row] = await db
    .select()
    .from(refreshTokens)
    .where(eq(refreshTokens.tokenHash, hash))
    .limit(1);

  const now = new Date();
  if (!row || row.expiresAt <= now) {
    return { ok: false };
  }

  if (row.revokedAt) {
    await revokeAllRefreshForAdmin(db, row.adminId);
    return { ok: false };
  }

  const { raw, hash: newHash } = randomRefreshToken();
  const expiresAt = new Date(Date.now() + config.jwtRefreshTtl * 1000);

  const revoked = await db
    .update(refreshTokens)
    .set({ revokedAt: now })
    .where(
      and(eq(refreshTokens.id, row.id), isNull(refreshTokens.revokedAt)),
    )
    .returning({ id: refreshTokens.id });

  if (revoked.length === 0) {
    await revokeAllRefreshForAdmin(db, row.adminId);
    return { ok: false };
  }

  await db.insert(refreshTokens).values({
    adminId: row.adminId,
    tokenHash: newHash,
    expiresAt,
    ipAddress: params.ip || null,
    userAgent: params.userAgent ?? null,
  });

  const [adminRow] = await db
    .select({ id: admins.id, role: admins.role, isActive: admins.isActive })
    .from(admins)
    .where(eq(admins.id, row.adminId))
    .limit(1);

  if (!adminRow?.isActive) return { ok: false };

  const role = adminRow.role as AdminRole;
  const accessToken = signAccessToken(config, adminRow.id, role);

  return {
    ok: true,
    accessToken,
    refreshRaw: raw,
    adminId: adminRow.id,
    role,
  };
}

export async function revokeRefreshByRaw(
  db: Database,
  refreshRaw: string,
): Promise<void> {
  const hash = hashToken(refreshRaw);
  const now = new Date();
  await db
    .update(refreshTokens)
    .set({ revokedAt: now })
    .where(
      and(eq(refreshTokens.tokenHash, hash), isNull(refreshTokens.revokedAt)),
    );
}

export async function revokeAllRefreshForAdmin(
  db: Database,
  adminId: string,
): Promise<void> {
  const now = new Date();
  await db
    .update(refreshTokens)
    .set({ revokedAt: now })
    .where(
      and(eq(refreshTokens.adminId, adminId), isNull(refreshTokens.revokedAt)),
    );
}

export async function changePassword(
  db: Database,
  adminId: string,
  currentPassword: string,
  newPassword: string,
): Promise<"ok" | "wrong_password" | "not_found"> {
  const [row] = await db
    .select()
    .from(admins)
    .where(eq(admins.id, adminId))
    .limit(1);

  if (!row) return "not_found";
  if (!(await verifyPassword(currentPassword, row.passwordHash))) {
    return "wrong_password";
  }

  const newHash = await hashPassword(newPassword);
  await db
    .update(admins)
    .set({
      passwordHash: newHash,
      updatedAt: new Date(),
    })
    .where(eq(admins.id, adminId));

  await revokeAllRefreshForAdmin(db, adminId);

  return "ok";
}
