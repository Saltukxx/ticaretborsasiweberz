/**
 * One-shot bootstrap: create the first `super_admin` (or upsert by email).
 *
 * Usage (from `backend/`):
 *   set DATABASE_URL=...
 *   set ADMIN_EMAIL=admin@example.com
 *   set ADMIN_PASSWORD=your-secure-password-min-12-chars
 *   npx tsx src/scripts/seedSuperAdmin.ts
 */
import { loadConfig } from "../config.js";
import { createDb, createPool } from "../db/connection.js";
import { admins } from "../db/schema/index.js";
import { eq } from "drizzle-orm";
import { hashPassword } from "../modules/auth/auth.service.js";

async function main() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD ?? "";
  const name = process.env.ADMIN_NAME?.trim() || "Super Admin";

  if (!email || !password) {
    console.error("Set ADMIN_EMAIL and ADMIN_PASSWORD in the environment.");
    process.exit(1);
  }
  if (password.length < 12) {
    console.error("ADMIN_PASSWORD must be at least 12 characters.");
    process.exit(1);
  }

  const config = loadConfig();
  const pool = createPool(config);
  const db = createDb(pool);

  const passwordHash = await hashPassword(password);

  const [existing] = await db
    .select({ id: admins.id })
    .from(admins)
    .where(eq(admins.email, email))
    .limit(1);

  if (existing) {
    await db
      .update(admins)
      .set({
        passwordHash,
        name,
        role: "super_admin",
        isActive: true,
        updatedAt: new Date(),
      })
      .where(eq(admins.id, existing.id));
    console.log("Updated existing admin:", email);
  } else {
    const [row] = await db
      .insert(admins)
      .values({
        email,
        passwordHash,
        name,
        role: "super_admin",
        isActive: true,
      })
      .returning({ id: admins.id });
    console.log("Created super_admin:", email, row?.id);
  }

  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
