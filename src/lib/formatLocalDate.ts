/** Parse YYYY-MM-DD as local calendar date (avoids UTC midnight off-by-one). */
export function parseLocalDate(isoDate: string): Date {
  const [y, m, d] = isoDate.slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function formatChartDate(isoDate: string): string {
  return parseLocalDate(isoDate).toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "short",
  });
}

export function formatLongDate(isoDate: string): string {
  return parseLocalDate(isoDate).toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
