import { eq } from "drizzle-orm";
import type { Database } from "../../db/connection.js";
import { admins } from "../../db/schema/index.js";
import { hashPassword } from "../auth/auth.service.js";

const SYNC_EMAIL = "sync@etb.internal";

export async function getOrCreateSyncAdminId(
  db: Database,
  email = process.env.SYNC_ADMIN_EMAIL?.trim().toLowerCase() || SYNC_EMAIL,
): Promise<string> {
  const [existing] = await db
    .select({ id: admins.id })
    .from(admins)
    .where(eq(admins.email, email))
    .limit(1);
  if (existing) return existing.id;

  const password = process.env.SYNC_ADMIN_PASSWORD ?? cryptoRandomPassword();
  const [row] = await db
    .insert(admins)
    .values({
      email,
      passwordHash: await hashPassword(password),
      name: "DataBank Sync",
      role: "super_admin",
      isActive: true,
    })
    .returning({ id: admins.id });

  if (!row) throw new Error("Failed to create sync admin");
  console.warn(
    `[databank] Created sync admin ${email} — set SYNC_ADMIN_PASSWORD in production.`,
  );
  return row.id;
}

function cryptoRandomPassword(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Buffer.from(bytes).toString("base64url") + "Aa1!";
}
