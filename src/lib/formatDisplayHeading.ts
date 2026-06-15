const DEFAULT_HEADING = "Erzurum Ticaret Borsası";

export type DisplayHeading = {
  lead: string;
  emphasis: string | null;
};

export function formatDisplayHeading(
  heading: string | null | undefined,
  fallback = DEFAULT_HEADING,
): DisplayHeading {
  const text = (heading?.trim() || fallback).trim();
  const parts = text.split(/\s+/).filter(Boolean);

  if (parts.length <= 1) {
    return { lead: text, emphasis: null };
  }

  return {
    lead: parts[0]!,
    emphasis: parts.slice(1).join(" "),
  };
}
