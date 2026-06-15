/**
 * Seed homepage president message (role_key: baskan) from static defaults + portrait file.
 * Run: npx tsx src/scripts/seedLeadershipPresident.ts
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { asc } from "drizzle-orm";
import { createPool, createDb } from "../db/connection.js";
import { loadConfig } from "../config.js";
import { admins } from "../db/schema/index.js";
import {
  createLeadership,
  getLeadershipByRoleKeyAdmin,
  PRESIDENT_ROLE_KEY,
} from "../modules/leadership/leadership.admin.service.js";
import { uploadMediaPublic } from "../modules/media/media.admin.service.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const portraitPath = join(
  __dirname,
  "../../../public/images/baskan-portre.png",
);

const PRESIDENT = {
  name: "Yıldırım Hakan ORAL",
  title: "Yönetim Kurulu Başkanı",
  messageTitle: "Üretimin emeğini, ticaretin güveniyle buluşturuyoruz.",
  eyebrow: "Başkanın Mesajı",
  quoteLines: [
    "Erzurum Ticaret Borsası olarak üreticimizin emeğini, tüccarımızın tecrübesini ve bölgemizin ticari potansiyelini daha güçlü bir kurumsal zeminde buluşturmak için çalışıyoruz.",
    "Şeffaf, güvenilir ve çağın gereklerine uygun hizmet anlayışımızla Erzurum'un tarımsal üretimine ve ticari geleceğine değer katmayı sürdüreceğiz.",
  ],
} as const;

async function main() {
  const config = loadConfig();
  const pool = createPool(config);
  const db = createDb(pool);

  const existing = await getLeadershipByRoleKeyAdmin(db, PRESIDENT_ROLE_KEY);
  if (existing) {
    console.log("President leadership row already exists, skipped.");
    await pool.end();
    return;
  }

  const [admin] = await db
    .select({ id: admins.id })
    .from(admins)
    .orderBy(asc(admins.createdAt))
    .limit(1);

  if (!admin) {
    console.error("No admin user found. Run seedSuperAdmin first.");
    process.exit(1);
  }

  let portraitId: string | null = null;

  try {
    const buffer = readFileSync(portraitPath);
    const uploaded = await uploadMediaPublic(db, config, {
      buffer,
      filename: "baskan-portre.png",
      mimetype: "image/png",
      adminId: admin.id,
    });
    if (uploaded.ok) {
      portraitId = uploaded.row.id;
      console.log("Uploaded president portrait to media library.");
    } else {
      console.warn("Portrait upload skipped (invalid file).");
    }
  } catch (err) {
    console.warn("Portrait file not found or unreadable:", portraitPath, err);
  }

  const result = await createLeadership(db, {
    roleKey: PRESIDENT_ROLE_KEY,
    name: PRESIDENT.name,
    title: PRESIDENT.title,
    messageTitle: PRESIDENT.messageTitle,
    eyebrow: PRESIDENT.eyebrow,
    quoteLines: [...PRESIDENT.quoteLines],
    portraitId,
    sortOrder: 0,
    isActive: true,
  });

  if (!result.ok) {
    console.error("Failed to create president leadership:", result.code);
    process.exit(1);
  }

  console.log("Seeded president leadership (baskan).");
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
