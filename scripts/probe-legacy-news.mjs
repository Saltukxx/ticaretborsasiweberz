const ids = [
  "6a1eedf1103fd79a5f539420",
  "6a1eed09103fd79a5f5392ff",
  "6a1eecb9103fd79a5f5391fb",
];

const BASE = "https://www.erzurumtb.org.tr";

for (const id of ids) {
  const url = `${BASE}/news/${id}`;
  const res = await fetch(url, { headers: { "User-Agent": "ETB-News-Import/1.0" } });
  console.log("\n===", id, res.status, "===");
  const html = await res.text();
  console.log("html len", html.length);

  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi)) {
    try {
      const data = JSON.parse(m[1]);
      console.log("JSON-LD keys", Object.keys(data));
      console.log(JSON.stringify(data, null, 2).slice(0, 1500));
    } catch (e) {
      console.log("json parse fail");
    }
  }

  const imgs = [...html.matchAll(/<img[^>]+src=["']([^"']+)["']/gi)].map((x) => x[1]);
  console.log("imgs", imgs.filter((u) => !u.includes("logo")));

  // probe common API paths
  for (const apiPath of [`/api/news/${id}`, `/api/content/${id}`, `/api/posts/${id}`]) {
    const ar = await fetch(BASE + apiPath, { headers: { Accept: "application/json" } });
    if (ar.ok) {
      const j = await ar.text();
      console.log("API HIT", apiPath, j.slice(0, 500));
    }
  }
}

// list page
const listRes = await fetch(`${BASE}/news/`, { headers: { "User-Agent": "ETB-News-Import/1.0" } });
const listHtml = await listRes.text();
const nextData = listHtml.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
if (nextData) console.log("\nNEXT_DATA found", nextData[1].slice(0, 500));
const nuxt = listHtml.match(/window\.__NUXT__\s*=\s*([\s\S]*?)<\/script>/);
if (nuxt) console.log("\nNUXT found", nuxt[1].slice(0, 500));
