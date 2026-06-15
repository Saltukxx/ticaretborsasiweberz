#!/usr/bin/env node
/**
 * Scrape leadership portraits from legacy erzurumtb.org.tr board pages.
 * Usage: node scripts/scrape-leadership-portraits.mjs
 */
const BOARDS = [
  { id: "684be8dd43fdfcdc3a431da1", group: "yonetim_kurulu", url: "https://www.erzurumtb.org.tr/boards/684be8dd43fdfcdc3a431da1" },
  { id: "680c9aca950a44d145ac33ad", group: "meclis", url: "https://www.erzurumtb.org.tr/boards/680c9aca950a44d145ac33ad" },
  { id: "684be97d43fdfcdc3a431dc1", group: "tobb_delegeleri", url: "https://www.erzurumtb.org.tr/boards/684be97d43fdfcdc3a431dc1" },
  { id: "684be22bf6f8419e31262ebd", group: "personel", url: "https://www.erzurumtb.org.tr/boards/684be22bf6f8419e31262ebd" },
  { id: "danisman", group: "danisman", url: "https://www.erzurumtb.org.tr/danismanimiz" },
];

const BASE = "https://www.erzurumtb.org.tr";

function normalizeName(s) {
  return s
    .replace(/\s+/g, " ")
    .trim()
    .toLocaleUpperCase("tr-TR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/İ/g, "I")
    .replace(/ı/g, "i");
}

function extractMembers(html) {
  const members = [];
  // Board cards: img followed by h3/h4 name and p title
  const cardRe =
    /<img[^>]+src="(\/uploads\/[^"]+)"[^>]*>[\s\S]*?<h[34][^>]*>([^<]+)<\/h[34]>[\s\S]*?<p[^>]*>([^<]+)<\/p>/gi;
  let m;
  while ((m = cardRe.exec(html)) !== null) {
    members.push({
      imageUrl: m[1].startsWith("http") ? m[1] : `${BASE}${m[1]}`,
      name: m[2].trim(),
      title: m[3].trim(),
    });
  }

  if (members.length === 0) {
    // Fallback: pair uploads with nearby text blocks
    const imgRe = /src="(\/uploads\/[^"]+)"/g;
    const imgs = [...html.matchAll(imgRe)].map((x) => x[1]);
    const nameRe = /<h[34][^>]*>([^<]+)<\/h[34]>/g;
    const names = [...html.matchAll(nameRe)].map((x) => x[1].trim());
    const titleRe = /<p class="[^"]*text-(?:sm|base)[^"]*"[^>]*>([^<]+)<\/p>/g;
    const titles = [...html.matchAll(titleRe)].map((x) => x[1].trim());
    const n = Math.min(imgs.length, names.length, titles.length);
    for (let i = 0; i < n; i++) {
      members.push({
        imageUrl: `${BASE}${imgs[i]}`,
        name: names[i],
        title: titles[i],
      });
    }
  }

  return members;
}

async function main() {
  const all = [];
  for (const board of BOARDS) {
    const res = await fetch(board.url, {
      headers: { "User-Agent": "ETB-Migration/1.0" },
      signal: AbortSignal.timeout(30000),
    });
    if (!res.ok) {
      console.error(`FAIL ${board.group}: HTTP ${res.status}`);
      continue;
    }
    const html = await res.text();
    const members = extractMembers(html);
    console.log(`\n# ${board.group} (${members.length})`);
    for (const member of members) {
      console.log(JSON.stringify({ ...member, group: board.group }));
      all.push({ ...member, group: board.group });
    }
  }
  console.log(`\nTotal: ${all.length}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
