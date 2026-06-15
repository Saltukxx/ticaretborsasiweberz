/** Use API quotes when non-empty; otherwise static fallback. */
export function resolveQuoteLines(
  apiLines: string[] | null | undefined,
  fallback: string[],
): string[] {
  if (apiLines && apiLines.length > 0) return apiLines;
  return fallback;
}
