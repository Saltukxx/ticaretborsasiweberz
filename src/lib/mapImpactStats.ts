export type ImpactStat = { value: number; label: string };

export function mapImpactStats(
  rows: { value: string; label: string }[] | undefined,
  fallback: ImpactStat[],
): ImpactStat[] {
  if (!rows?.length) return fallback;

  const mapped = rows
    .map((s) => {
      const n = Number.parseFloat(s.value);
      if (!Number.isFinite(n)) return null;
      return { value: n, label: s.label };
    })
    .filter((row): row is ImpactStat => row !== null);

  if (mapped.length === 0) return fallback;
  if (mapped.length < fallback.length) return fallback;
  return mapped;
}
