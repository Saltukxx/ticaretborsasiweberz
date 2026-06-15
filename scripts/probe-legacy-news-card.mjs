const res = await fetch("https://www.erzurumtb.org.tr/news/?page=1", {
  headers: { "User-Agent": "ETB-News-Import/1.0" },
});
const html = await res.text();

// sample card
const card = html.match(/6a1eedf1103fd79a5f539420[\s\S]{0,800}/);
console.log(card?.[0]);

const id = "6a1eedf1103fd79a5f539420";
const detail = await fetch(`https://www.erzurumtb.org.tr/news/${id}`, {
  headers: { "User-Agent": "ETB-News-Import/1.0" },
});
const dhtml = await detail.text();

const proseMatch = dhtml.match(/class="prose[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<\/div>/i);
console.log("\nPROSE HTML:\n", proseMatch?.[1]?.slice(0, 1200));

// count pages
for (let p = 1; p <= 12; p++) {
  const r = await fetch(`https://www.erzurumtb.org.tr/news/?page=${p}`, {
    headers: { "User-Agent": "ETB" },
  });
  const h = await r.text();
  const n = [...h.matchAll(/href=["']\/news\/([a-f0-9]+)["']/gi)].length;
  console.log("page", p, "links", n, "115?", h.includes("115"));
}
