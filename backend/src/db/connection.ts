import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import pg from "pg";
import type { Config } from "../config.js";
import * as schema from "./schema/index.js";

export type Database = NodePgDatabase<typeof schema>;

export function createPool(config: Config) {
  return new pg.Pool({
    connectionString: config.databaseUrl,
    max: config.databasePoolMax,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
  });
}

export function createDb(pool: pg.Pool): Database {
  return drizzle(pool, { schema });
}
