/**
 * PoC: fetch DataBank HTML, parse sample rows, print slug mapping.
 *
 *   npx tsx src/scripts/databankPoc.ts
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DatabankClient } from "../modules/databankSync/client.js";
import { mapHomeRowToEntries } from "../modules/databankSync/mapper.js";
import { isoDateToday } from "../modules/databankSync/normalize.js";
import { parseHomeTableHtml, parseTescilBulletinHtml } from "../modules/databankSync/parsers/htmlTable.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURE_DIR = path.join(
  __dirname,
  "../modules/databankSync/__fixtures__",
);

async function main() {
  const client = new DatabankClient({
    baseUrl: "https://borsa.erzurumtb.org.tr/web/data/",
    requestDelayMs: 500,
  });

  await fs.mkdir(FIXTURE_DIR, { recursive: true });

  const homeHtml = await client.fetchHomeTable("2026", "HUBUBATLAR");
  await fs.writeFile(path.join(FIXTURE_DIR, "home-hububatlar.html"), homeHtml, "utf8");

  const allHtml = await client.fetchHomeTable("2026", "00");
  await fs.writeFile(path.join(FIXTURE_DIR, "home-all-groups.html"), allHtml, "utf8");

  const today = isoDateToday();
  const tescilHtml = await client.fetchTescilBulletin("D", today);
  await fs.writeFile(
    path.join(FIXTURE_DIR, "tescil-daily.html"),
    tescilHtml,
    "utf8",
  );

  const homeRows = parseHomeTableHtml(homeHtml, "HUBUBATLAR");
  const tescilRows = parseTescilBulletinHtml(tescilHtml);

  console.log("=== PoC summary ===");
  console.log("Home rows (HUBUBATLAR):", homeRows.length);
  console.log("Tescil rows (daily):", tescilRows.length);

  const samples = homeRows.filter((r) =>
    ["BUĞDAY", "ARPA", "PİRİNÇ"].some((n) => r.productName.includes(n)),
  );

  for (const row of samples.slice(0, 6)) {
    const mapped = mapHomeRowToEntries(row);
    console.log("\n---", row.productName, row.saleType, row.lastTradeDate);
    for (const m of mapped) {
      console.log(
        `  ${m.productSlug}: avg=${m.avgPrice} low=${m.lowPrice} high=${m.highPrice}`,
      );
    }
  }

  const bugdayHts = homeRows.find(
    (r) => r.productName === "BUĞDAY" && r.saleType === "HTS",
  );
  if (bugdayHts) {
    const m = mapHomeRowToEntries(bugdayHts);
    const satis = m.find((e) => e.productSlug.endsWith("-satis"));
    console.log("\n=== GO/NO-GO: BUĞDAY HTS satış ===");
    console.log(satis ?? "MISSING satis row");
    console.log(
      satis?.avgPrice === "12.18" ? "PASS (matches live DataBank)" : "CHECK VALUES",
    );
  }

  console.log("\nFixtures saved to", FIXTURE_DIR);
  console.log("PoC: scrape GO");
}

main().catch((err) => {
  console.error("PoC FAILED", err);
  process.exit(1);
});
