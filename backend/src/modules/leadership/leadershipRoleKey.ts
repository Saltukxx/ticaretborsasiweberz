import type { LeadershipGroupKey } from "../../db/schema/leadership.js";
import { transliterateTr } from "../databankSync/normalize.js";

const GROUP_PREFIX: Record<LeadershipGroupKey, string> = {
  yonetim_kurulu: "yk",
  meclis: "meclis",
  tobb_delegeleri: "tobb",
  personel: "personel",
  danisman: "danisman",
};

/** Skip honorifics when building slug from display name. */
const TITLE_PREFIX_RE =
  /^(prof\.?\s*dr\.?|dr\.?|av\.?|doç\.?\s*dr\.?|yrd\.?\s*doç\.?\s*dr\.?)\s+/i;

function namePartsForRoleKey(name: string): string[] {
  const cleaned = name.replace(TITLE_PREFIX_RE, "").trim();
  return cleaned
    .split(/\s+/)
    .map((part) =>
      transliterateTr(part)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, ""),
    )
    .filter(Boolean);
}

/** Base role key before uniqueness suffix, e.g. meclis_ahmet_yilmaz */
export function buildRoleKeyBase(
  groupKey: LeadershipGroupKey,
  name: string,
): string {
  const prefix = GROUP_PREFIX[groupKey];
  const parts = namePartsForRoleKey(name);
  const slug = parts.join("_").slice(0, 80);
  const base = slug ? `${prefix}_${slug}` : `${prefix}_uye`;
  return base.replace(/_+/g, "_").slice(0, 100);
}

export function withRoleKeySuffix(base: string, n: number): string {
  if (n <= 1) return base.slice(0, 100);
  const suffix = `_${n}`;
  return `${base.slice(0, 100 - suffix.length)}${suffix}`;
}
