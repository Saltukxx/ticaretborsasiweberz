import { z } from "zod";

const decStr = z
  .union([z.number(), z.string().min(1)])
  .transform((v) => String(v));

export const currencyRatesListQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(500).default(50),
  offset: z.coerce.number().int().min(0).default(0),
  code: z.string().max(20).optional(),
});

export const createCurrencyRateBodySchema = z.object({
  code: z.string().min(1).max(20),
  label: z.string().max(100).nullable().optional(),
  rateValue: decStr,
  changePct: decStr.nullable().optional(),
  direction: z.coerce.number().int().min(-1).max(1).nullable().optional(),
});
