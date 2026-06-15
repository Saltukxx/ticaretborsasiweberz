/**
 * Backfill message_title for leadership rows where null (president band H2).
 * Run: npx tsx src/scripts/seedLeadershipMessageTitle.ts
 */
import { eq, isNull } from "drizzle-orm";
import { createPool, createDb } from "../db/connection.js";
import { loadConfig } from "../config.js";
import { leadership } from "../db/schema/index.js";

const DEFAULT_MESSAGE_TITLE =
  "Üretimin emeğini, ticaretin güveniyle buluşturuyoruz.";

async function main() {
  const config = loadConfig();
  const pool = createPool(config);
  const db = createDb(pool);

  const rows = await db
    .select({ id: leadership.id, roleKey: leadership.roleKey })
    .from(leadership)
    .where(isNull(leadership.messageTitle));

  if (rows.length === 0) {
    console.log("All leadership rows already have message_title.");
    await pool.end();
    return;
  }

  for (const row of rows) {
    await db
      .update(leadership)
      .set({ messageTitle: DEFAULT_MESSAGE_TITLE, updatedAt: new Date() })
      .where(eq(leadership.id, row.id));
  }

  console.log(`Updated message_title for ${rows.length} leadership row(s).`);
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
