/**
 * Import leadership portraits from legacy erzurumtb.org.tr board pages (JSON-LD).
 * Run: npx tsx src/scripts/importLeadershipPortraits.ts
 */
import { extname } from "node:path";
import { asc, eq } from "drizzle-orm";
import { createPool, createDb } from "../db/connection.js";
import { loadConfig } from "../config.js";
import { admins, leadership } from "../db/schema/index.js";
import { uploadMediaPublic } from "../modules/media/media.admin.service.js";

const LEGACY_BASE = "https://www.erzurumtb.org.tr";

const BOARD_SOURCES: { group: string; url: string }[] = [
  {
    group: "yonetim_kurulu",
    url: `${LEGACY_BASE}/boards/684be8dd43fdfcdc3a431da1`,
  },
  {
    group: "meclis",
    url: `${LEGACY_BASE}/boards/680c9aca950a44d145ac33ad`,
  },
  {
    group: "tobb_delegeleri",
    url: `${LEGACY_BASE}/boards/684be97d43fdfcdc3a431dc1`,
  },
  {
    group: "personel",
    url: `${LEGACY_BASE}/boards/684be22bf6f8419e31262ebd`,
  },
];

const STATIC_MEMBERS: {
  group: string;
  name: string;
  imageUrl: string;
}[] = [
  {
    group: "danisman",
    name: "Prof. Dr. Ensar AĞIRMAN",
    imageUrl: `${LEGACY_BASE}/img/ensaragirman.png`,
  },
];

type LegacyMember = { group: string; name: string; imageUrl: string };

function normalizeName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/İ/g, "I")
    .replace(/ı/g, "i")
    .toUpperCase()
    .replace(/\s+/g, " ")
    .trim();
}

function resolveLegacyUrl(pathOrUrl: string): string {
  if (pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://")) {
    return pathOrUrl;
  }
  return `${LEGACY_BASE}${pathOrUrl.startsWith("/") ? "" : "/"}${pathOrUrl}`;
}

function extractJsonLdMembers(html: string): Omit<LegacyMember, "group">[] {
  const re = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi;
  for (const match of html.matchAll(re)) {
    try {
      const data = JSON.parse(match[1]!) as {
        mainEntity?: { member?: { name?: string; jobTitle?: string; image?: string }[] };
      };
      const members = data.mainEntity?.member;
      if (!Array.isArray(members) || members.length === 0) continue;
      return members
        .filter((m) => m.name && m.image)
        .map((m) => ({
          name: m.name!.trim(),
          imageUrl: resolveLegacyUrl(m.image!),
        }));
    } catch {
      // try next block
    }
  }
  return [];
}

function guessMime(url: string, contentType: string | null): string {
  if (contentType?.startsWith("image/")) return contentType.split(";")[0]!.trim();
  const ext = extname(url.split("?")[0] ?? url).toLowerCase();
  if (ext === ".png") return "image/png";
  if (ext === ".webp") return "image/webp";
  if (ext === ".gif") return "image/gif";
  return "image/jpeg";
}

function safeFilename(name: string, url: string): string {
  const slug = normalizeName(name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
  const ext = extname(url.split("?")[0] ?? url).toLowerCase() || ".jpg";
  return `${slug || "portrait"}${ext}`;
}

async function fetchLegacyMembers(): Promise<LegacyMember[]> {
  const out: LegacyMember[] = [];

  for (const source of BOARD_SOURCES) {
    const res = await fetch(source.url, {
      headers: { "User-Agent": "ETB-Portrait-Import/1.0" },
      signal: AbortSignal.timeout(45000),
    });
    if (!res.ok) {
      console.warn(`Skip ${source.group}: HTTP ${res.status}`);
      continue;
    }
    const html = await res.text();
    const members = extractJsonLdMembers(html);
    console.log(`Fetched ${members.length} members from ${source.group}`);
    for (const m of members) {
      out.push({ ...m, group: source.group });
    }
  }

  for (const m of STATIC_MEMBERS) {
    out.push(m);
  }

  return out;
}

async function main() {
  const config = loadConfig();
  const pool = createPool(config);
  const db = createDb(pool);

  const [admin] = await db
    .select({ id: admins.id })
    .from(admins)
    .orderBy(asc(admins.createdAt))
    .limit(1);
  if (!admin) {
    console.error("No admin user found.");
    process.exit(1);
  }

  const rows = await db
    .select({
      id: leadership.id,
      roleKey: leadership.roleKey,
      groupKey: leadership.groupKey,
      name: leadership.name,
      portraitId: leadership.portraitId,
    })
    .from(leadership)
    .where(eq(leadership.isActive, true));

  const byGroupName = new Map<string, typeof rows>();
  for (const row of rows) {
    const key = `${row.groupKey}::${normalizeName(row.name)}`;
    const bucket = byGroupName.get(key) ?? [];
    bucket.push(row);
    byGroupName.set(key, bucket);
  }

  const legacyMembers = await fetchLegacyMembers();
  const portraitCache = new Map<string, string>();
  let uploaded = 0;
  let linked = 0;
  let skipped = 0;

  for (const member of legacyMembers) {
    const key = `${member.group}::${normalizeName(member.name)}`;
    const targets = byGroupName.get(key) ?? [];
    if (targets.length === 0) {
      console.warn(`No DB match: ${member.group} / ${member.name}`);
      continue;
    }

    const needsPortrait = targets.some((t) => !t.portraitId);
    if (!needsPortrait) {
      skipped += targets.length;
      continue;
    }

    let portraitId = portraitCache.get(member.imageUrl);
    if (!portraitId) {
      const imgRes = await fetch(member.imageUrl, {
        headers: { "User-Agent": "ETB-Portrait-Import/1.0" },
        signal: AbortSignal.timeout(45000),
      });
      if (!imgRes.ok) {
        console.warn(`Image fetch failed (${imgRes.status}): ${member.imageUrl}`);
        continue;
      }
      const buffer = Buffer.from(await imgRes.arrayBuffer());
      const filename = safeFilename(member.name, member.imageUrl);
      const mimetype = guessMime(member.imageUrl, imgRes.headers.get("content-type"));
      const result = await uploadMediaPublic(db, config, {
        buffer,
        filename,
        mimetype,
        adminId: admin.id,
      });
      if (!result.ok) {
        console.warn(`Upload rejected for ${member.name}`);
        continue;
      }
      portraitId = result.row.id;
      portraitCache.set(member.imageUrl, portraitId);
      uploaded += 1;
      console.log(`Uploaded: ${member.name} (${filename})`);
    }

    for (const target of targets) {
      if (target.portraitId) continue;
      await db
        .update(leadership)
        .set({ portraitId, updatedAt: new Date() })
        .where(eq(leadership.id, target.id));
      target.portraitId = portraitId;
      linked += 1;
    }
  }

  // Same person in multiple groups may share image URL — fill remaining by name globally
  const globalByName = new Map<string, string>();
  for (const member of legacyMembers) {
    const norm = normalizeName(member.name);
    const pid = portraitCache.get(member.imageUrl);
    if (pid) globalByName.set(norm, pid);
  }

  for (const row of rows) {
    if (row.portraitId) continue;
    const pid = globalByName.get(normalizeName(row.name));
    if (!pid) continue;
    await db
      .update(leadership)
      .set({ portraitId: pid, updatedAt: new Date() })
      .where(eq(leadership.id, row.id));
    linked += 1;
  }

  console.log(
    `Done. uploaded=${uploaded} linked=${linked} skipped=${skipped} cache=${portraitCache.size}`,
  );
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
