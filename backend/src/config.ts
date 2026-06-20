import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.coerce.number().int().positive().default(3001),
  HOST: z.string().default("0.0.0.0"),
  TRUST_PROXY: z.enum(["true", "false", ""]).optional(),
  BASE_URL: z.string().url().optional(),
  UPLOADS_DIR: z.string().optional(),

  DATABASE_URL: z.string().min(1),
  DATABASE_POOL_MAX: z.coerce.number().int().positive().default(10),

  REDIS_URL: z.string().optional(),
  REDIS_PREFIX: z.string().default("etb:"),

  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
  JWT_ACCESS_TTL: z.coerce.number().int().positive().default(900),
  JWT_REFRESH_TTL: z.coerce.number().int().positive().default(604_800),

  SESSION_COOKIE_NAME: z.string().default("etb_refresh"),
  COOKIE_SECURE: z.enum(["true", "false", ""]).optional(),

  ALLOWED_ORIGINS: z.string().default(
    "http://localhost:5173,http://localhost:5174",
  ),

  R2_ACCOUNT_ID: z.string().optional(),
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_BUCKET_PUBLIC: z.string().optional(),
  R2_BUCKET_PRIVATE: z.string().optional(),
  R2_PUBLIC_URL: z.string().url().optional(),

  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().default("gemini-2.5-flash"),
  GEMINI_MAX_OUTPUT_TOKENS: z.coerce.number().int().positive().default(512),

  DATABANK_BASE_URL: z.string().url().optional(),
  DATABANK_SYNC_ENABLED: z.string().optional(),
  DATABANK_REQUEST_DELAY_MS: z.coerce.number().int().min(0).default(2000),
  DATABANK_TESCIL_BACKFILL_DAYS: z.coerce.number().int().min(0).default(0),
  DATABANK_SYNC_SECTIONS: z.string().default("home,tescil"),
  DATABANK_PRICE_SOURCE_PRIORITY: z.string().default("tescil,home"),
  DATABANK_CHART_YEARS_BACK: z.coerce.number().int().min(1).default(6),
  DATABANK_VOLUME_YEARS_FROM: z.coerce.number().int().min(2000).default(2009),
  DATABANK_HOURLY_SYNC: z.string().optional(),
  DATABANK_SYNC_CRON: z.string().default("5 * * * *"),
  MARKET_TICKER_ENABLED: z.string().optional(),
  MARKET_TICKER_FINANCE_URL: z.string().url().optional(),
  SYNC_ADMIN_EMAIL: z.string().email().optional(),
  SYNC_ADMIN_PASSWORD: z.string().optional(),
});

export type RawEnv = z.infer<typeof envSchema>;

export type Config = {
  nodeEnv: RawEnv["NODE_ENV"];
  port: number;
  host: string;
  trustProxy: boolean;
  baseUrl?: string;
  uploadsDir: string;
  databaseUrl: string;
  databasePoolMax: number;
  redisUrl?: string;
  redisPrefix: string;
  jwtSecret: string;
  jwtAccessTtl: number;
  jwtRefreshTtl: number;
  sessionCookieName: string;
  cookieSecure: boolean;
  allowedOrigins: string;
  r2?: {
    accountId: string;
    accessKeyId: string;
    secretAccessKey: string;
    bucketPublic: string;
    bucketPrivate: string;
    publicUrl: string;
  };
  geminiApiKey?: string;
  geminiModel: string;
  geminiMaxOutputTokens: number;
  databankBaseUrl: string;
  databankSyncEnabled: boolean;
  databankRequestDelayMs: number;
  databankTescilBackfillDays: number;
  databankSyncSections: ("home" | "tescil" | "charts" | "volume")[];
  databankPriceSourcePriority: ("tescil" | "home")[];
  databankChartYearsBack: number;
  databankVolumeYearsFrom: number;
  databankHourlySync: boolean;
  databankSyncCronExpr: string;
  marketTickerEnabled: boolean;
  marketTickerFinanceUrl: string;
};

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const parsed = envSchema.safeParse(env);
  if (!parsed.success) {
    const msg = parsed.error.flatten().fieldErrors;
    throw new Error(`Invalid environment configuration: ${JSON.stringify(msg)}`);
  }
  const e = parsed.data;

  const JWT_PLACEHOLDER_SECRETS = new Set([
    "change_me_to_at_least_32_chars_random_hex_or_string",
    "replace-with-a-long-random-secret-min-32-chars",
  ]);
  if (JWT_PLACEHOLDER_SECRETS.has(e.JWT_SECRET)) {
    throw new Error(
      "JWT_SECRET must be a unique random value — generate with: openssl rand -hex 32",
    );
  }

  const isProd = e.NODE_ENV === "production";
  if (isProd && !e.REDIS_URL?.trim()) {
    throw new Error(
      "REDIS_URL is required in production for login lockout and caching.",
    );
  }
  const trustProxy = e.TRUST_PROXY === "true";
  const baseIsHttps = e.BASE_URL?.startsWith("https:") ?? false;
  // Default Secure cookies only on HTTPS. Plain-HTTP VPS deploys need COOKIE_SECURE=false.
  const cookieSecure =
    e.COOKIE_SECURE === "true" ||
    (e.COOKIE_SECURE == null && isProd && baseIsHttps);

  const hasR2 =
    e.R2_ACCOUNT_ID &&
    e.R2_ACCESS_KEY_ID &&
    e.R2_SECRET_ACCESS_KEY &&
    e.R2_BUCKET_PUBLIC &&
    e.R2_BUCKET_PRIVATE &&
    e.R2_PUBLIC_URL;

  return {
    nodeEnv: e.NODE_ENV,
    port: e.PORT,
    host: e.HOST,
    trustProxy,
    baseUrl: e.BASE_URL,
    uploadsDir: e.UPLOADS_DIR ?? "/app/uploads",
    databaseUrl: e.DATABASE_URL,
    databasePoolMax: e.DATABASE_POOL_MAX,
    redisUrl: e.REDIS_URL?.trim() || undefined,
    redisPrefix: e.REDIS_PREFIX,
    jwtSecret: e.JWT_SECRET,
    jwtAccessTtl: e.JWT_ACCESS_TTL,
    jwtRefreshTtl: e.JWT_REFRESH_TTL,
    sessionCookieName: e.SESSION_COOKIE_NAME,
    cookieSecure,
    allowedOrigins: e.ALLOWED_ORIGINS,
    geminiApiKey: e.GEMINI_API_KEY?.trim() || undefined,
    geminiModel: e.GEMINI_MODEL.trim() || "gemini-2.5-flash",
    geminiMaxOutputTokens: e.GEMINI_MAX_OUTPUT_TOKENS,
    databankBaseUrl:
      e.DATABANK_BASE_URL?.trim() ||
      "https://borsa.erzurumtb.org.tr/web/data/",
    databankSyncEnabled: e.DATABANK_SYNC_ENABLED !== "false",
    databankRequestDelayMs: e.DATABANK_REQUEST_DELAY_MS,
    databankTescilBackfillDays: e.DATABANK_TESCIL_BACKFILL_DAYS,
    databankSyncSections: parseSyncSections(e.DATABANK_SYNC_SECTIONS),
    databankPriceSourcePriority: parseSourcePriority(
      e.DATABANK_PRICE_SOURCE_PRIORITY,
    ),
    databankChartYearsBack: e.DATABANK_CHART_YEARS_BACK,
    databankVolumeYearsFrom: e.DATABANK_VOLUME_YEARS_FROM,
    databankHourlySync:
      e.DATABANK_HOURLY_SYNC !== "false" &&
      e.DATABANK_SYNC_ENABLED !== "false",
    databankSyncCronExpr: e.DATABANK_SYNC_CRON.trim() || "5 * * * *",
    marketTickerEnabled: e.MARKET_TICKER_ENABLED !== "false",
    marketTickerFinanceUrl:
      e.MARKET_TICKER_FINANCE_URL?.trim() ||
      "https://finance.truncgil.com/api/today.json",
    r2: hasR2
      ? {
          accountId: e.R2_ACCOUNT_ID!,
          accessKeyId: e.R2_ACCESS_KEY_ID!,
          secretAccessKey: e.R2_SECRET_ACCESS_KEY!,
          bucketPublic: e.R2_BUCKET_PUBLIC!,
          bucketPrivate: e.R2_BUCKET_PRIVATE!,
          publicUrl: e.R2_PUBLIC_URL!,
        }
      : undefined,
  };
}

export function parseAllowedOrigins(raw: string): string[] {
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

const SYNC_SECTIONS = new Set([
  "home",
  "tescil",
  "charts",
  "volume",
]);

type SyncSection = "home" | "tescil" | "charts" | "volume";

function parseSyncSections(raw: string): SyncSection[] {
  const parts = raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter((s): s is SyncSection => SYNC_SECTIONS.has(s));
  return parts.length ? parts : ["home", "tescil"];
}

function parseSourcePriority(raw: string): ("tescil" | "home")[] {
  const parts = raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter((s): s is "tescil" | "home" => s === "tescil" || s === "home");
  return parts.length ? parts : ["tescil", "home"];
}
