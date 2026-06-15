const pages = [
  ["aytemiz-petrol", "Aytemiz Petrol"],
  ["petrol-ofisi", "Petrol Ofisi"],
  ["dhl-ecommerce", "DHL eCommerce"],
  ["aras-kargo", "Aras Kargo"],
  ["mgc-i-elbiseleri", "MGC İş Elbiseleri"],
  ["gne-optik", "GNE Optik"],
  ["saygn-optik", "Saygın Optik"],
];

for (const [slug, fallbackTitle] of pages) {
  const h = await (await fetch(`https://www.erzurumtb.org.tr/pages/${slug}`)).text();
  const h1Match = [...h.matchAll(/<h1[^>]*>([^<]+)<\/h1>/gi)]
    .map((m) => m[1].trim())
    .filter((t) => !t.includes("Erzurum Ticaret"));
  const title = h1Match[0] || fallbackTitle;
  const contentMatch = h.match(/class="page-content"[^>]*>([\s\S]*?)<\/div>\s*<\/div>/i);
  const html = contentMatch?.[1]?.trim() ?? "";
  const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  const imgMatch = html.match(/src="(\/uploads\/[^"]+)"/);
  console.log(JSON.stringify({ slug, title, img: imgMatch?.[1] ?? null, text: text.slice(0, 350) }));
}
