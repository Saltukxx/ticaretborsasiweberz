import type { PublicEvent } from "./publicApi";

export type EventsBoardStamp = {
  months: string[];
  year: string;
};

/** Derive stamp labels from event dates (upcoming first, else any in list). */
export function formatEventsBoardStamp(events: PublicEvent[]): EventsBoardStamp | null {
  const now = Date.now();
  const withDates = events
    .filter((e): e is PublicEvent & { startsAt: string } => Boolean(e.startsAt))
    .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());

  const upcoming = withDates.filter((e) => new Date(e.startsAt).getTime() >= now);
  const source = upcoming.length > 0 ? upcoming : withDates;
  if (source.length === 0) return null;

  const monthFmt = new Intl.DateTimeFormat("tr-TR", { month: "long" });
  const months: string[] = [];
  for (const e of source) {
    const m = monthFmt.format(new Date(e.startsAt));
    if (!months.includes(m)) months.push(m);
    if (months.length >= 4) break;
  }

  const years = [...new Set(source.map((e) => new Date(e.startsAt).getFullYear()))].sort(
    (a, b) => a - b,
  );
  const year =
    years.length <= 1
      ? String(years[0] ?? new Date().getFullYear())
      : `${years[0]}–${years[years.length - 1]}`;

  return { months, year };
}
