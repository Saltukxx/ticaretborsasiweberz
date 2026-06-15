const id = "6a1eedf1103fd79a5f539420";
const res = await fetch(`https://www.erzurumtb.org.tr/news/${id}`, {
  headers: { "User-Agent": "ETB-News-Import/1.0" },
});
const html = await res.text();

// find body content patterns
const patterns = [
  /articleBody["']?\s*:\s*["']([^"']+)/,
  /"content"\s*:\s*"([^"]{100,})"/,
  /class="[^"]*prose[^"]*"[^>]*>([\s\S]*?)<\/div>/,
  /class="[^"]*news-detail[^"]*"[^>]*>([\s\S]*?)<\/div>/,
  /class="[^"]*content[^"]*"[^>]*>([\s\S]*?)<\/div>/,
];

for (const p of patterns) {
  const m = html.match(p);
  if (m) console.log("MATCH", p.source.slice(0, 40), (m[1] ?? m[0]).slice(0, 300));
}

// extract all script tags with news data
for (const m of html.matchAll(/<script[^>]*>([\s\S]{200,8000}?)<\/script>/gi)) {
  const s = m[1];
  if (s.includes("articleBody") || s.includes("6a1eed") || s.includes("Hisarcıklıoğlu")) {
    console.log("\n--- script snippet ---\n", s.slice(0, 1200));
  }
}

// look for __NEXT_DATA__ or similar embedded state
const embedded = html.match(/self\.__next_f\.push\(\[1,"([^"]{500,})"/);
if (embedded) console.log("next push", embedded[1].slice(0, 400));

// grep for Hisarciklioglu paragraph in raw html
const idx = html.indexOf("Hisarcıklıoğlu");
console.log("\ncontext around text:", html.slice(idx - 200, idx + 600));

// find news list API in html
const apis = [...html.matchAll(/"(\/api\/[^"]+)"/g)].map((x) => x[1]);
console.log("\napi paths unique", [...new Set(apis)].slice(0, 20));
