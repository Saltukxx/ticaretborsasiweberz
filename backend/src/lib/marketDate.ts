import { sql, type SQL } from "drizzle-orm";

/** Calendar date in Europe/Istanbul — same basis as DataBank sync (`isoDateToday`). */
export const istanbulTodaySql: SQL = sql`(NOW() AT TIME ZONE 'Europe/Istanbul')::date`;
