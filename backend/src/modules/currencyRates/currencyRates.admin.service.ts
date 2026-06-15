import {
  count,
  desc,
  eq,
  type SQL,
} from "drizzle-orm";
import type { Database } from "../../db/connection.js";
import { currencyRates } from "../../db/schema/index.js";

export async function listCurrencyRatesAdmin(
  db: Database,
  params: {
    limit: number;
    offset: number;
    code?: string;
  },
) {
  const filter: SQL | undefined = params.code
    ? eq(currencyRates.code, params.code)
    : undefined;

  const countBase = db.select({ total: count() }).from(currencyRates);
  const [countRow] = await (filter ? countBase.where(filter) : countBase);

  const rowsBase = db
    .select()
    .from(currencyRates)
    .orderBy(desc(currencyRates.recordedAt));
  const rows = await (filter
    ? rowsBase.where(filter)
    : rowsBase
  )
    .limit(params.limit)
    .offset(params.offset);

  return { rows, total: Number(countRow?.total ?? 0) };
}

export async function createCurrencyRateSnapshot(
  db: Database,
  input: {
    code: string;
    label?: string | null;
    rateValue: string;
    changePct?: string | null;
    direction?: number | null;
    createdBy?: string | null;
  },
) {
  const [row] = await db
    .insert(currencyRates)
    .values({
      code: input.code,
      label: input.label ?? null,
      rateValue: input.rateValue,
      changePct: input.changePct ?? null,
      direction: input.direction ?? null,
      createdBy: input.createdBy ?? null,
    })
    .returning();
  if (!row) throw new Error("insert currency_rates failed");
  return row;
}

export async function deleteCurrencyRateSnapshot(
  db: Database,
  id: string,
): Promise<boolean> {
  const result = await db
    .delete(currencyRates)
    .where(eq(currencyRates.id, id))
    .returning({ id: currencyRates.id });
  return result.length > 0;
}
