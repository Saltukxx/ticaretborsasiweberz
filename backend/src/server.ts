import Fastify from "fastify";
import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { createReadStream } from "node:fs";
import fs from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadConfig, parseAllowedOrigins } from "./config.js";
import adminAuthPlugin from "./plugins/adminAuth.js";
import { createDb, createPool } from "./db/connection.js";
import { connectRedis } from "./lib/redis.js";
import { authRoutes } from "./modules/auth/auth.routes.js";
import { adminAnnouncementsPlugin } from "./modules/announcements/announcements.admin.routes.js";
import { publicAnnouncementsPlugin } from "./modules/announcements/announcements.public.routes.js";
import { publicNewsPlugin } from "./modules/news/news.public.routes.js";
import { adminNewsPlugin } from "./modules/news/news.admin.routes.js";
import { publicPricesPlugin } from "./modules/prices/prices.public.routes.js";
import { publicExternalBulletinsPlugin } from "./modules/externalBulletins/externalBulletins.routes.js";
import { adminProductsPlugin } from "./modules/prices/products.admin.routes.js";
import { adminPriceEntriesPlugin } from "./modules/prices/priceEntries.admin.routes.js";
import { publicCurrencyRatesPlugin } from "./modules/currencyRates/currencyRates.public.routes.js";
import { adminCurrencyRatesPlugin } from "./modules/currencyRates/currencyRates.admin.routes.js";
import { publicEventsPlugin } from "./modules/events/events.public.routes.js";
import { adminEventsPlugin } from "./modules/events/events.admin.routes.js";
import { publicReportsPlugin } from "./modules/reports/reports.public.routes.js";
import { adminReportsPlugin } from "./modules/reports/reports.admin.routes.js";
import { publicProjectsPlugin } from "./modules/projects/projects.public.routes.js";
import { adminProjectsPlugin } from "./modules/projects/projects.admin.routes.js";
import { publicServicesPlugin } from "./modules/services/services.public.routes.js";
import { adminServicesPlugin } from "./modules/services/services.admin.routes.js";
import { publicGeoIndicationsPlugin } from "./modules/geographicalIndications/geographicalIndications.public.routes.js";
import { adminGeoIndicationsPlugin } from "./modules/geographicalIndications/geographicalIndications.admin.routes.js";
import { publicLeadershipPlugin } from "./modules/leadership/leadership.public.routes.js";
import { adminLeadershipPlugin } from "./modules/leadership/leadership.admin.routes.js";
import { publicStatsPlugin } from "./modules/stats/stats.public.routes.js";
import { adminStatsPlugin } from "./modules/stats/stats.admin.routes.js";
import { adminAuditPlugin } from "./modules/audit/audit.admin.routes.js";
import { adminUsersPlugin } from "./modules/users/users.admin.routes.js";
import { adminMediaPlugin } from "./modules/media/media.admin.routes.js";
import { publicMapDistrictsPlugin } from "./modules/mapDistricts/mapDistricts.public.routes.js";
import { adminMapDistrictsPlugin } from "./modules/mapDistricts/mapDistricts.admin.routes.js";
import { publicCorporatePlugin } from "./modules/corporate/corporate.public.routes.js";
import { adminCorporatePlugin } from "./modules/corporate/corporate.admin.routes.js";
import { publicHeroPlugin } from "./modules/hero/hero.public.routes.js";
import { publicRecipeChatPlugin } from "./modules/recipeChat/recipeChat.public.routes.js";
import { publicSiteChatPlugin } from "./modules/siteChat/siteChat.public.routes.js";
import { adminHeroPlugin } from "./modules/hero/hero.admin.routes.js";
import { adminDatabankSyncPlugin } from "./modules/databankSync/sync.admin.routes.js";
import { startDatabankHourlyCron } from "./modules/databankSync/databankCron.js";
import { publicMarketTickerPlugin } from "./modules/marketTicker/marketTicker.public.routes.js";
import { startMarketTickerCron } from "./modules/marketTicker/marketTickerCron.js";
import { publicSitePlugin } from "./modules/site/site.public.routes.js";
import { adminSitePlugin } from "./modules/site/site.admin.routes.js";
import { adminChatLogsPlugin } from "./modules/chatLogs/chatLogs.admin.routes.js";
import { sitemapPlugin } from "./modules/seo/sitemap.routes.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function buildServer() {
  const config = loadConfig();
  const pool = createPool(config);
  const db = createDb(pool);

  let redis: Awaited<ReturnType<typeof connectRedis>> | null = null;
  if (config.redisUrl) {
    try {
      redis = await connectRedis(config.redisUrl);
    } catch (err) {
      if (config.nodeEnv === "production") throw err;
      console.warn("Redis unavailable, continuing without cache:", err);
    }
  }

  const app = Fastify({
    logger: config.nodeEnv === "development",
    requestIdHeader: "x-request-id",
    genReqId: () => randomUUID(),
    trustProxy: config.trustProxy,
  });

  app.decorate("config", config);
  app.decorate("db", db);
  app.decorate("redis", redis);

  await app.register(helmet, {
    global: true,
    contentSecurityPolicy: false,
  });

  await app.register(cors, {
    origin: parseAllowedOrigins(config.allowedOrigins),
    credentials: true,
  });

  await app.register(cookie);

  await app.register(adminAuthPlugin);

  await app.register(rateLimit, {
    global: true,
    max: config.nodeEnv === "production" ? 120 : 1000,
    timeWindow: "1 minute",
    allowList: (req) => {
      const url = req.url.split("?")[0] ?? "";
      return (
        url.startsWith("/healthz") ||
        url.startsWith("/readyz") ||
        url.startsWith("/sitemap.xml") ||
        url.startsWith("/uploads/") ||
        /\/api\/v1\/reports\/[^/]+\/download$/.test(url) ||
        /\/api\/v1\/corporate\/documents\/[^/]+\/download$/.test(url)
      );
    },
  });

  // ── Local uploads static server ─────────────────────────────────────────
  // Serves files saved by the local-disk media fallback (when R2 is not set).
  // Only enabled when R2 is absent — with R2 files are served from the CDN.
  const MIME_MAP: Record<string, string> = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
    ".gif": "image/gif",
    ".pdf": "application/pdf",
  };

  await fs.mkdir(config.uploadsDir, { recursive: true });

  app.get<{ Params: { filename: string }; Querystring: { download?: string } }>(
    "/uploads/:filename",
    async (req, reply) => {
      const { filename } = req.params;
      if (!filename || filename.includes("..") || /[/\\]/.test(filename)) {
        return reply.status(400).send({ error: "Invalid filename" });
      }
      const filePath = path.join(config.uploadsDir, filename);
      try {
        const info = await fs.stat(filePath);
        const ext = path.extname(filename).toLowerCase();
        const contentType = MIME_MAP[ext] ?? "application/octet-stream";
        void reply.header("Content-Type", contentType);
        void reply.header("Content-Length", info.size);
        void reply.header("X-Content-Type-Options", "nosniff");
        void reply.header("Cache-Control", "public, max-age=31536000, immutable");
        if (ext === ".pdf") {
          const forceDownload = req.query.download === "1";
          void reply.header(
            "Content-Disposition",
            forceDownload
              ? `attachment; filename="${filename}"`
              : "inline",
          );
        }
        return reply.send(createReadStream(filePath));
      } catch {
        return reply.status(404).send({ error: "Not found" });
      }
    },
  );

  app.get("/healthz", async () => ({ status: "ok" as const }));

  app.get("/readyz", async (_req, reply) => {
    try {
      await pool.query("SELECT 1");
      if (redis) await redis.ping();
      return { status: "ready" as const };
    } catch {
      return reply.status(503).send({ status: "not_ready" as const });
    }
  });

  await app.register(sitemapPlugin);

  await app.register(authRoutes, { prefix: "/api/v1/admin/auth" });
  await app.register(publicNewsPlugin, { prefix: "/api/v1" });
  await app.register(publicAnnouncementsPlugin, { prefix: "/api/v1" });
  await app.register(publicPricesPlugin, { prefix: "/api/v1" });
  await app.register(publicExternalBulletinsPlugin, { prefix: "/api/v1" });
  await app.register(publicCurrencyRatesPlugin, { prefix: "/api/v1" });
  await app.register(publicMarketTickerPlugin, { prefix: "/api/v1" });
  await app.register(publicEventsPlugin, { prefix: "/api/v1" });
  await app.register(publicReportsPlugin, { prefix: "/api/v1" });
  await app.register(publicProjectsPlugin, { prefix: "/api/v1" });
  await app.register(publicServicesPlugin, { prefix: "/api/v1" });
  await app.register(publicGeoIndicationsPlugin, { prefix: "/api/v1" });
  await app.register(publicLeadershipPlugin, { prefix: "/api/v1" });
  await app.register(publicStatsPlugin, { prefix: "/api/v1" });
  await app.register(publicMapDistrictsPlugin, { prefix: "/api/v1" });
  await app.register(publicCorporatePlugin, { prefix: "/api/v1" });
  await app.register(publicHeroPlugin, { prefix: "/api/v1" });
  await app.register(publicRecipeChatPlugin, { prefix: "/api/v1" });
  await app.register(publicSiteChatPlugin, { prefix: "/api/v1" });
  await app.register(publicSitePlugin, { prefix: "/api/v1" });
  await app.register(adminNewsPlugin, { prefix: "/api/v1/admin/news" });
  await app.register(adminAnnouncementsPlugin, {
    prefix: "/api/v1/admin/announcements",
  });
  await app.register(adminProductsPlugin, { prefix: "/api/v1/admin/products" });
  await app.register(adminPriceEntriesPlugin, {
    prefix: "/api/v1/admin/prices",
  });
  await app.register(adminCurrencyRatesPlugin, {
    prefix: "/api/v1/admin/currency-rates",
  });
  await app.register(adminEventsPlugin, {
    prefix: "/api/v1/admin/events",
  });
  await app.register(adminReportsPlugin, {
    prefix: "/api/v1/admin/reports",
  });
  await app.register(adminProjectsPlugin, {
    prefix: "/api/v1/admin/projects",
  });
  await app.register(adminServicesPlugin, {
    prefix: "/api/v1/admin/services",
  });
  await app.register(adminGeoIndicationsPlugin, {
    prefix: "/api/v1/admin/geo-indications",
  });
  await app.register(adminLeadershipPlugin, {
    prefix: "/api/v1/admin/leadership",
  });
  await app.register(adminStatsPlugin, {
    prefix: "/api/v1/admin/stats",
  });
  await app.register(adminAuditPlugin, { prefix: "/api/v1/admin" });
  await app.register(adminUsersPlugin, { prefix: "/api/v1/admin" });
  await app.register(adminMediaPlugin, {
    prefix: "/api/v1/admin/media",
  });
  await app.register(adminMapDistrictsPlugin, {
    prefix: "/api/v1/admin/map-districts",
  });
  await app.register(adminCorporatePlugin, {
    prefix: "/api/v1/admin/corporate",
  });
  await app.register(adminHeroPlugin, {
    prefix: "/api/v1/admin/hero",
  });
  await app.register(adminDatabankSyncPlugin, {
    prefix: "/api/v1/admin/sync/databank",
  });
  await app.register(adminSitePlugin, { prefix: "/api/v1/admin" });
  await app.register(adminChatLogsPlugin, { prefix: "/api/v1/admin" });

  return { app, pool, redis, config };
}

async function runMigrations(pool: ReturnType<typeof createPool>) {
  const db = createDb(pool);
  const migrationsFolder = path.join(__dirname, "db", "migrations");
  await migrate(db, { migrationsFolder });
}

async function main() {
  const { app, pool, redis, config } = await buildServer();
  const db = app.db;

  if (process.env.RUN_MIGRATIONS === "true") {
    await runMigrations(pool);
  }

  const close = async () => {
    try {
      await app.close();
    } finally {
      if (redis) redis.disconnect();
      await pool.end();
    }
  };

  const signals: NodeJS.Signals[] = ["SIGINT", "SIGTERM"];
  for (const sig of signals) {
    process.on(sig, () => {
      void close().then(() => process.exit(0));
    });
  }

  await app.listen({ port: config.port, host: config.host });

  startDatabankHourlyCron(app, db, redis, config);
  startMarketTickerCron(app, db, redis, config);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

export { buildServer, runMigrations };
