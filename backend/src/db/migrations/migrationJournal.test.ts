import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

const migrationsDir = path.dirname(fileURLToPath(import.meta.url));
const journalPath = path.join(migrationsDir, "meta", "_journal.json");

test("migration journal lists every SQL migration in order", () => {
  const sqlFiles = readdirSync(migrationsDir)
    .filter((name) => name.endsWith(".sql"))
    .sort();

  const journal = JSON.parse(readFileSync(journalPath, "utf8")) as {
    entries: Array<{ idx: number; tag: string }>;
  };

  const journalTags = journal.entries.map((entry) => `${entry.tag}.sql`);
  assert.deepEqual(
    journalTags,
    sqlFiles,
    "Drizzle journal must include every migration SQL file so db:migrate applies the full schema",
  );

  journal.entries.forEach((entry, index) => {
    assert.equal(entry.idx, index, `journal idx mismatch at ${entry.tag}`);
  });
});
