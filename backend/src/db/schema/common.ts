import { customType } from "drizzle-orm/pg-core";

/** PostgreSQL `inet` for IP logging */
export const inetCol = customType<{ data: string | null }>({
  dataType() {
    return "inet";
  },
});

/** Turkish full-text search vector; maintained by DB trigger */
export const tsvectorCol = customType<{ data: unknown }>({
  dataType() {
    return "tsvector";
  },
});
