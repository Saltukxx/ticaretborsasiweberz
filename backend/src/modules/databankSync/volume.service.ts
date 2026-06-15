import { sql } from "drizzle-orm";
import type { Database } from "../../db/connection.js";
import { marketVolumeMonthly } from "../../db/schema/index.js";
import type { VolumeSeriesPoint } from "./parsers/highchartsEmbed.js";

export async function upsertVolumeSeries(
  db: Database,
  points: VolumeSeriesPoint[],
): Promise<number> {
  let n = 0;
  for (const p of points) {
    const chartKey = `${p.chartTitle}`.slice(0, 120);
    const seriesName = `${p.seriesName}`.slice(0, 120);
    await db
      .insert(marketVolumeMonthly)
      .values({
        year: p.year,
        chartKey,
        seriesName,
        payload: {
          categories: p.categories,
          values: p.values,
        },
        source: "databank_volume",
      })
      .onConflictDoUpdate({
        target: [
          marketVolumeMonthly.year,
          marketVolumeMonthly.chartKey,
          marketVolumeMonthly.seriesName,
          marketVolumeMonthly.source,
        ],
        set: {
          payload: sql`excluded.payload`,
        },
      });
    n += 1;
  }
  return n;
}
