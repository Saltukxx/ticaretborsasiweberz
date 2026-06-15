const res = await fetch("https://www.erzurumtb.org.tr/news/", {
  headers: { "User-Agent": "ETB-News-Import/1.0" },
});
const html = await res.text();
const links = [...html.matchAll(/href=["'](\/news\/[a-f0-9]+)["']/gi)].map((x) => x[1]);
console.log("unique links", [...new Set(links)].length, [...new Set(links)].slice(0, 5));

// pagination?
for (const path of ["/api/news", "/api/news?page=1", "/api/content/news", "/news?page=2"]) {
  const r = await fetch("https://www.erzurumtb.org.tr" + path, {
    headers: { Accept: "application/json", "User-Agent": "ETB" },
  });
  console.log(path, r.status, r.headers.get("content-type"));
  if (r.ok) {
    const t = await r.text();
    console.log(t.slice(0, 300));
  }
}

// search for fetch URLs in page source
const fetches = [...html.matchAll(/fetch\(["']([^"']+)["']/g)].map((x) => x[1]);
console.log("fetch urls", [...new Set(fetches)]);

const xhr = [...html.matchAll(/["'](\/news[^"']*)["']/g)]
  .map((x) => x[1])
  .filter((u) => u.includes("api") || u.includes("page"));
console.log("news urls", [...new Set(xhr)].slice(0, 30));
