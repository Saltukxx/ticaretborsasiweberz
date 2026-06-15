const ids = [
  "6a1eedf1103fd79a5f539420",
  "6a1eed09103fd79a5f5392ff",
  "6a1eecb9103fd79a5f5391fb",
];
for (const id of ids) {
  const html = await fetch(`https://www.erzurumtb.org.tr/news/${id}`).then((r) =>
    r.text(),
  );
  const hasLd = html.includes("NewsArticle");
  const prose = html.match(/<article class="prose[^"]*"[^>]*>([\s\S]*?)<\/article>/i);
  console.log(id, hasLd ? "jsonld" : "no-ld", prose?.[1]?.slice(0, 100));
}
