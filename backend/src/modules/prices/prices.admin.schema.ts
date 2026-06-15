import { z } from "zod";

const dateStr = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "YYYY-MM-DD formatında olmalı");

const decStr = z
  .union([z.number(), z.string().min(1)])
  .transform((v) => String(v));

export const productsListQuerySchema = z.object({
  q: z.string().max(200).optional(),
  activeOnly: z.enum(["true", "false"]).optional(),
});

export const productIdParamsSchema = z.object({
  id: z.string().uuid(),
});

export const createProductBodySchema = z.object({
  slug: z.string().min(1).max(100),
  name: z.string().min(1).max(255),
  category: z.string().min(1).max(100),
  unit: z.string().min(1).max(50),
  isActive: z.boolean().optional(),
  sortOrder: z.coerce.number().int().optional(),
});

export const patchProductBodySchema = z
  .object({
    slug: z.string().min(1).max(100).optional(),
    name: z.string().min(1).max(255).optional(),
    category: z.string().min(1).max(100).optional(),
    unit: z.string().min(1).max(50).optional(),
    isActive: z.boolean().optional(),
    sortOrder: z.coerce.number().int().optional(),
  })
  .refine((o) => Object.keys(o).length > 0, {
    message: "En az bir alan gerekli.",
  });

export const priceEntriesListQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(500).default(50),
  offset: z.coerce.number().int().min(0).default(0),
  productId: z.string().uuid().optional(),
  from: dateStr.optional(),
  to: dateStr.optional(),
});

export const priceEntryIdParamsSchema = z.object({
  id: z.string().uuid(),
});

export const createPriceEntryBodySchema = z.object({
  productId: z.string().uuid(),
  entryDate: dateStr,
  avgPrice: decStr,
  lowPrice: decStr,
  highPrice: decStr,
  changePct: decStr.nullable().optional(),
  volume: decStr.nullable().optional(),
  volumeUnit: z.string().max(50).nullable().optional(),
  sessionTime: z.string().max(16).nullable().optional(),
});

export const patchPriceEntryBodySchema = z
  .object({
    avgPrice: decStr.optional(),
    lowPrice: decStr.optional(),
    highPrice: decStr.optional(),
    changePct: decStr.nullable().optional(),
    volume: decStr.nullable().optional(),
    volumeUnit: z.string().max(50).nullable().optional(),
    sessionTime: z.string().max(16).nullable().optional(),
  })
  .refine((o) => Object.keys(o).length > 0, {
    message: "En az bir alan gerekli.",
  });

export const bulkPriceEntriesBodySchema = z.object({
  rows: z
    .array(
    z.object({
      productSlug: z.string().min(1).max(100),
      entryDate: dateStr,
      avgPrice: decStr,
      lowPrice: decStr,
      highPrice: decStr,
      changePct: decStr.nullable().optional(),
      volume: decStr.nullable().optional(),
      volumeUnit: z.string().max(50).nullable().optional(),
      sessionTime: z.string().max(16).nullable().optional(),
    }),
  )
    .max(500),
});

export const priceHistoryPeriodSchema = z.enum(["7d", "30d", "90d", "365d"]);

export type PriceHistoryPeriod = z.infer<typeof priceHistoryPeriodSchema>;

const PERIOD_DAYS: Record<PriceHistoryPeriod, number> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
  "365d": 365,
};

export function periodToDays(period: PriceHistoryPeriod): number {
  return PERIOD_DAYS[period];
}

export const priceHistoryQuerySchema = z
  .object({
    limit: z.coerce.number().int().min(1).max(400).optional(),
    period: priceHistoryPeriodSchema.optional(),
    from: dateStr.optional(),
    to: dateStr.optional(),
  })
  .refine(
    (q) => !(q.from && q.to) || q.from <= q.to,
    { message: "from must be on or before to", path: ["to"] },
  );
