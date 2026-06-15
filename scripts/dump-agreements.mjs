const pages = [
  "aytemiz-petrol",
  "petrol-ofisi",
  "dhl-ecommerce",
  "aras-kargo",
  "mgc-i-elbiseleri",
  "gne-optik",
  "saygn-optik",
];

const out = [];
for (const slug of pages) {
  const h = await (await fetch(`https://www.erzurumtb.org.tr/pages/${slug}`)).text();
  const contentMatch = h.match(/class="page-content"[^>]*>([\s\S]*?)<\/div>\s*<\/div>/i);
  const html = contentMatch?.[1]?.trim() ?? "";
  const h1Match = [...h.matchAll(/<h1[^>]*>([^<]+)<\/h1>/gi)]
    .map((m) => m[1].trim())
    .filter((t) => !t.includes("Erzurum Ticaret"));
  out.push({ slug, title: h1Match[0], html });
}
console.log(JSON.stringify(out, null, 2));
