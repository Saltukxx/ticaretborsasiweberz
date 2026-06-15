import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: [
    "./src/db/schema/admins.ts",
    "./src/db/schema/refreshTokens.ts",
    "./src/db/schema/media.ts",
    "./src/db/schema/news.ts",
    "./src/db/schema/announcements.ts",
    "./src/db/schema/commodityProducts.ts",
    "./src/db/schema/priceEntries.ts",
    "./src/db/schema/currencyRates.ts",
    "./src/db/schema/events.ts",
    "./src/db/schema/reports.ts",
    "./src/db/schema/projects.ts",
    "./src/db/schema/services.ts",
    "./src/db/schema/geographicalIndications.ts",
    "./src/db/schema/leadership.ts",
    "./src/db/schema/auditLog.ts",
    "./src/db/schema/statsSnapshot.ts",
  ],
  out: "./src/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "postgres://etb:etb@localhost:5433/etb",
  },
  strict: true,
  verbose: true,
});
