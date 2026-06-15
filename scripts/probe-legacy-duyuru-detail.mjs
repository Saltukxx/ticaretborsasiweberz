const id = process.argv[2] || "682ed3a6759758c55e411852";
const html = await fetch(`https://www.erzurumtb.org.tr/news/${id}`).then((r) => r.text());
const prose = html.match(/<article class="prose[^"]*"[^>]*>([\s\S]*?)<\/article>/i);
const ld = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
console.log("title h1", html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1]?.slice(0,120));
console.log("prose len", prose?.[1]?.length);
console.log("prose", prose?.[1]?.slice(0,500));
if (ld) {
  const j = JSON.parse(ld[1]);
  const items = Array.isArray(j) ? j : [j];
  const art = items.find((x) => x["@type"] === "NewsArticle");
  console.log("jsonld", art?.headline, art?.datePublished);
}
