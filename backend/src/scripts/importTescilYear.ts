/**
 * 2026 (veya belirtilen yıl) yıllık + aylık tescil bültenlerini DataBank'tan çeker.
 *
 * Run (backend/):
 *   npx tsx src/scripts/importTescilYear.ts --year=2026
 *   npx tsx src/scripts/importTescilYear.ts --year=2026 --dry-run
 */
import { loadConfig } from "../config.js";
import { createDb, createPool } from "../db/connection.js";
import { invalidatePricesPublicCache } from "../lib/pricesCache.js";
import { connectRedis } from "../lib/redis.js";
import { deleteFuturePriceEntries } from "../modules/prices/cleanupFuturePriceEntries.js";
import { DatabankClient } from "../modules/databankSync/client.js";
import {
  databankConfigFromApp,
} from "../modules/databankSync/sync.service.js";
import { getOrCreateSyncAdminId } from "../modules/databankSync/syncAdmin.js";
import {
  ensureProducts,
  mapHomeRowToEntries,
  mapTescilRowToEntries,
  repairProductDisplayNames,
  toBulkRows,
} from "../modules/databankSync/mapper.js";
import {
  databankMonthKey,
  entryDateForYearlyBulletin,
  isoDateToday,
  monthEndOrTodayIso,
} from "../modules/databankSync/normalize.js";
import {
  parseHomeTableHtml,
  parseTescilBulletinHtml,
} from "../modules/databankSync/parsers/htmlTable.js";
import {
  enrichChangePctFromHistory,
  filterValidEntries,
} from "../modules/databankSync/validate.js";
import { bulkUpsertPriceEntries } from "../modules/prices/priceEntries.admin.service.js";
import type { MappedPriceEntry } from "../modules/databankSync/types.js";

type CliOptions = {
  year: number;
  dryRun: boolean;
  yearly: boolean;
  monthly: boolean;
  home: boolean;
};

function parseArgs(argv: string[]): CliOptions {
  let year = new Date().getFullYear();
  let dryRun = false;
  let yearly = true;
  let monthly = true;
  let home = true;

  for (const arg of argv) {
    if (arg === "--dry-run") dryRun = true;
    else if (arg === "--no-yearly") yearly = false;
    else if (arg === "--no-monthly") monthly = false;
    else if (arg === "--no-home") home = false;
    else if (arg.startsWith("--year=")) {
      year = Number(arg.slice("--year=".length));
    }
  }

  if (!Number.isFinite(year) || year < 2009 || year > 2100) {
    throw new Error("Invalid --year");
  }

  return { year, dryRun, yearly, monthly, home };
}

async function upsertEntries(
  db: ReturnType<typeof createDb>,
  redis: Awaited<ReturnType<typeof connectRedis>> | null,
  redisPrefix: string,
  adminId: string,
  entries: MappedPriceEntry[],
  dryRun: boolean,
): Promise<number> {
  const { valid, rejected } = filterValidEntries(entries);
  if (rejected.length > 0) {
    console.warn(
      `Skipped ${rejected.length} invalid row(s)`,
      rejected.slice(0, 3).map((r) => ({ slug: r.entry.productSlug, reason: r.reason })),
    );
  }
  if (valid.length === 0 || dryRun) return valid.length;

  await enrichChangePctFromHistory(db, valid);
  await ensureProducts(db, valid);
  const result = await bulkUpsertPriceEntries(db, adminId, toBulkRows(valid));
  if (!result.ok) {
    throw new Error(`bulk upsert failed: ${result.slug}`);
  }
  await repairProductDisplayNames(db);
  await invalidatePricesPublicCache(redis, redisPrefix);
  return result.upserted;
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const config = loadConfig();
  const pool = createPool(config);
  const db = createDb(pool);

  let redis: Awaited<ReturnType<typeof connectRedis>> | null = null;
  if (config.redisUrl) {
    try {
      redis = await connectRedis(config.redisUrl);
    } catch {
      console.warn("Redis unavailable, continuing without cache.");
    }
  }

  const cfg = databankConfigFromApp(config);
  const client = new DatabankClient({
    baseUrl: cfg.baseUrl,
    requestDelayMs: cfg.requestDelayMs,
  });
  const adminId = await getOrCreateSyncAdminId(db);
  const yearStr = String(opts.year);
  const entries: MappedPriceEntry[] = [];

  console.log(`DataBank import: year=${opts.year}`, opts);

  if (opts.home) {
    const html = await client.fetchHomeTable(yearStr, "00");
    const rows = parseHomeTableHtml(html, "TÜM GRUPLAR");
    for (const r of rows) {
      entries.push(...mapHomeRowToEntries(r));
    }
    console.log(`Home table (${yearStr}): ${rows.length} product rows`);
  }

  if (opts.yearly) {
    const html = await client.fetchTescilBulletinYearly(yearStr);
    const rows = parseTescilBulletinHtml(html);
    const entryDate = entryDateForYearlyBulletin(opts.year);
    const today = isoDateToday();
    let skipped = 0;
    for (const r of rows) {
      // Devam eden yılın yıllık özeti günlük tescil satırının üzerine yazmasın.
      if (entryDate === today) {
        skipped += 1;
        continue;
      }
      entries.push(...mapTescilRowToEntries(r, entryDate));
    }
    console.log(
      `Yearly tescil (${yearStr}): ${rows.length} rows → entry_date=${entryDate}${skipped ? ` (${skipped} skipped, current year)` : ""}`,
    );
  }

  if (opts.monthly) {
    const now = new Date();
    const maxMonth =
      opts.year < now.getFullYear()
        ? 12
        : opts.year > now.getFullYear()
          ? 0
          : now.getMonth() + 1;

    for (let m = 1; m <= maxMonth; m += 1) {
      const monKey = databankMonthKey(opts.year, m);
      const entryDate = monthEndOrTodayIso(opts.year, m);
      const today = isoDateToday();
      // Devam eden ay günlük senkrona bırakılır; ay sonu tarihi grafikte geleceğe taşmasın.
      if (entryDate === today) {
        console.log(`Monthly ${monKey}: skipped (current month, daily sync owns ${today})`);
        continue;
      }
      try {
        const html = await client.fetchTescilBulletinMonthly(monKey);
        const rows = parseTescilBulletinHtml(html);
        for (const r of rows) {
          entries.push(...mapTescilRowToEntries(r, entryDate));
        }
        console.log(`Monthly ${monKey}: ${rows.length} rows → ${entryDate}`);
      } catch (err) {
        console.warn(
          `Monthly ${monKey} failed:`,
          err instanceof Error ? err.message : err,
        );
      }
    }
  }

  const deduped = dedupeEntries(entries);
  console.log(`Total mapped entries (deduped): ${deduped.length}`);

  const upserted = await upsertEntries(
    db,
    redis,
    config.redisPrefix,
    adminId,
    deduped,
    opts.dryRun,
  );

  console.log(
    opts.dryRun
      ? `[dry-run] would upsert ${upserted} entries`
      : `Done. upserted=${upserted}`,
  );

  if (!opts.dryRun) {
    const removed = await deleteFuturePriceEntries(db);
    if (removed > 0) {
      console.log(`Removed ${removed} future-dated price row(s).`);
    }
  }

  await pool.end();
  redis?.disconnect();
}

function dedupeEntries(entries: MappedPriceEntry[]): MappedPriceEntry[] {
  const map = new Map<string, MappedPriceEntry>();
  for (const e of entries) {
    map.set(`${e.productSlug}|${e.entryDate}`, e);
  }
  return [...map.values()];
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
