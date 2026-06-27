import { desc, eq } from "drizzle-orm";
import type { Config } from "../../config.js";
import type { Database } from "../../db/connection.js";
import { databankSyncRuns } from "../../db/schema/index.js";
import { invalidatePricesPublicCache } from "../../lib/pricesCache.js";
import type { RedisClient } from "../../lib/redis.js";
import { bulkUpsertPriceEntries } from "../prices/priceEntries.admin.service.js";
import { deleteFuturePriceEntries } from "../prices/cleanupFuturePriceEntries.js";
import { DatabankClient } from "./client.js";
import {
  ensureProducts,
  mapHomeRowToEntries,
  mapTescilRowToEntries,
  deactivateCorruptProducts,
  repairProductDisplayNames,
  toBulkRows,
} from "./mapper.js";
import { addDays, isoDateToday } from "./normalize.js";
import {
  parseProductCatalog,
  parseProductChartHtml,
  parseVolumePageHtml,
} from "./parsers/highchartsEmbed.js";
import {
  parseHomeTableHtml,
  parseTescilBulletinHtml,
} from "./parsers/htmlTable.js";
import { getOrCreateSyncAdminId } from "./syncAdmin.js";
import { upsertMonthlyHistory } from "./monthlyHistory.service.js";
import { upsertVolumeSeries } from "./volume.service.js";
import type { SyncSection } from "./types.js";
import { mergeByPriority } from "./mergePrices.js";
import {
  enrichChangePctFromHistory,
  filterValidEntries,
} from "./validate.js";
import { storeBulletinSessionSlugs } from "../../lib/pricesCache.js";

export const HOME_GROUPS = [
  "00",
  "HUBUBATLAR",
  "HUBUBAT MAMÜLLERİ",
  "BAKLİYAT MAMÜLLERİ",
  "YAĞLI TOHUMLAR",
  "NEBATİ YAĞLAR",
  "HAYVANİ YAĞLAR",
  "ÇEŞİTLİ GIDA MADDELERİ",
  "ORMAN MAHSÜLLERİ",
  "TEKSTİL HAMMADDELERİ",
  "CANLI HAYVANLAR",
  "HAM DERİLER",
  "AV DERİLERİ",
  "ÇEŞİTLİ MADDELER",
  "KURU VE YAŞ MEYVELER",
  "KOTA DIŞI MADDELER",
  "RESEN TESCİLLER",
] as const;

export type DatabankSyncConfig = {
  baseUrl: string;
  enabled: boolean;
  requestDelayMs: number;
  tescilBackfillDays: number;
  sections: SyncSection[];
  sourcePriority: ("tescil" | "home")[];
  chartYearsBack: number;
  volumeYearsFrom: number;
};

export function databankConfigFromApp(config: Config): DatabankSyncConfig {
  return {
    baseUrl:
      config.databankBaseUrl ??
      "https://borsa.erzurumtb.org.tr/web/data/",
    enabled: config.databankSyncEnabled,
    requestDelayMs: config.databankRequestDelayMs,
    tescilBackfillDays: config.databankTescilBackfillDays,
    sections: config.databankSyncSections,
    sourcePriority: config.databankPriceSourcePriority,
    chartYearsBack: config.databankChartYearsBack,
    volumeYearsFrom: config.databankVolumeYearsFrom,
  };
}

export type SyncResult = {
  runId: string;
  status: "success" | "failed" | "skipped";
  rowsUpserted: number;
  chartsProcessed: number;
  groupsProcessed: number;
  errorMessage?: string;
};

let databankSyncInProgress = false;

export async function runDatabankSync(
  db: Database,
  redis: RedisClient | null,
  redisPrefix: string,
  cfg: DatabankSyncConfig,
  opts?: { sections?: SyncSection[]; dryRun?: boolean },
): Promise<SyncResult> {
  if (!cfg.enabled) {
    throw new Error("DataBank sync is disabled (DATABANK_SYNC_ENABLED=false)");
  }

  if (databankSyncInProgress) {
    return {
      runId: "",
      status: "skipped",
      rowsUpserted: 0,
      chartsProcessed: 0,
      groupsProcessed: 0,
      errorMessage: "already_running",
    };
  }

  databankSyncInProgress = true;

  try {
    const sections = opts?.sections ?? cfg.sections;
    const client = new DatabankClient({
      baseUrl: cfg.baseUrl,
      requestDelayMs: cfg.requestDelayMs,
    });
    const year = new Date().getFullYear().toString();
    const adminId = await getOrCreateSyncAdminId(db);

    const [run] = await db
      .insert(databankSyncRuns)
      .values({
        status: "running",
        sections,
      })
      .returning({ id: databankSyncRuns.id });

    if (!run) throw new Error("sync run insert failed");

    let rowsUpserted = 0;
    let chartsProcessed = 0;
    let groupsProcessed = 0;

    try {
      const homeEntries: ReturnType<typeof mapHomeRowToEntries> = [];
      const tescilEntries: ReturnType<typeof mapTescilRowToEntries> = [];

      if (sections.includes("home")) {
        const html = await client.fetchHomeTable(year, "00");
        const rows = parseHomeTableHtml(html, "TÜM GRUPLAR");
        for (const r of rows) {
          homeEntries.push(...mapHomeRowToEntries(r));
        }
        groupsProcessed = 1;
      }

      if (sections.includes("tescil")) {
        const today = isoDateToday();
        const days = Math.max(0, cfg.tescilBackfillDays);
        for (let d = 0; d <= days; d++) {
          const date = addDays(today, -d);
          const html = await client.fetchTescilBulletin("D", date);
          const rows = parseTescilBulletinHtml(html);
          for (const r of rows) {
            tescilEntries.push(...mapTescilRowToEntries(r, date));
          }
        }
      }

      const merged = mergeByPriority(
        homeEntries,
        tescilEntries,
        cfg.sourcePriority,
      );

      const { valid: validated, rejected } = filterValidEntries(merged);
      if (rejected.length > 0) {
        console.warn(
          `[databank] ${rejected.length} row(s) skipped (validation)`,
          rejected.slice(0, 5).map((r) => ({
            slug: r.entry.productSlug,
            reason: r.reason,
          })),
        );
      }

      if (!opts?.dryRun && validated.length > 0) {
        await enrichChangePctFromHistory(db, validated);
        await ensureProducts(db, validated);
        const bulk = toBulkRows(validated);
        const result = await bulkUpsertPriceEntries(db, adminId, bulk);
        if (!result.ok) {
          throw new Error(`bulk upsert failed: unknown slug ${result.slug}`);
        }
        rowsUpserted = result.upserted;
        const removedFuture = await deleteFuturePriceEntries(db);
        if (removedFuture > 0) {
          console.warn(
            `[databank] removed ${removedFuture} future-dated price row(s)`,
          );
        }
        await repairProductDisplayNames(db);
        await deactivateCorruptProducts(db);
        if (tescilEntries.length > 0) {
          await storeBulletinSessionSlugs(redis, redisPrefix, tescilEntries);
        }
        await invalidatePricesPublicCache(redis, redisPrefix);
      } else if (opts?.dryRun) {
        rowsUpserted = validated.length;
      }

      if (sections.includes("charts") && !opts?.dryRun) {
        const catalogHtml = await client.fetchProductCatalogPage();
        const catalog = parseProductCatalog(catalogHtml);
        const edate = isoDateToday();
        const bdate = `${Number(year) - cfg.chartYearsBack}-01-01`;

        for (const product of catalog) {
          const html = await client.fetchProductChart({
            mname: product.name,
            itemsIslem: "1",
            itemsPer: "3",
            bdate,
            edate,
          });
          const points = parseProductChartHtml(
            html,
            product.name,
            product.category,
            "GENEL",
            "mustahsil",
          );
          if (points.length > 0) {
            chartsProcessed += await upsertMonthlyHistory(db, points);
          }
        }
      }

      if (sections.includes("volume") && !opts?.dryRun) {
        const currentYear = new Date().getFullYear();
        for (let y = cfg.volumeYearsFrom; y <= currentYear; y++) {
          const html = await client.fetchVolumeYear(String(y));
          const series = parseVolumePageHtml(html, String(y));
          await upsertVolumeSeries(db, series);
        }
      }

      await db
        .update(databankSyncRuns)
        .set({
          status: "success",
          finishedAt: new Date(),
          groupsProcessed,
          rowsUpserted,
          chartsProcessed,
        })
        .where(eq(databankSyncRuns.id, run.id));

      return {
        runId: run.id,
        status: "success",
        rowsUpserted,
        chartsProcessed,
        groupsProcessed,
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      await db
        .update(databankSyncRuns)
        .set({
          status: "failed",
          finishedAt: new Date(),
          groupsProcessed,
          rowsUpserted,
          chartsProcessed,
          errorMessage: msg,
        })
        .where(eq(databankSyncRuns.id, run.id));
      return {
        runId: run.id,
        status: "failed",
        rowsUpserted,
        chartsProcessed,
        groupsProcessed,
        errorMessage: msg,
      };
    }
  } finally {
    databankSyncInProgress = false;
  }
}

export async function listSyncRuns(db: Database, limit = 20) {
  return db
    .select()
    .from(databankSyncRuns)
    .orderBy(desc(databankSyncRuns.startedAt))
    .limit(limit);
}
