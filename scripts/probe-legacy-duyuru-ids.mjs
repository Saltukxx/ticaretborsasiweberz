const base = "https://www.erzurumtb.org.tr/news?type=duyuru";
const ids = new Set();
for (let page = 1; page <= 5; page += 1) {
  const html = await fetch(`${base}&page=${page}`).then((r) => r.text());
  for (const m of html.matchAll(/\/news\/([a-f0-9]{24})/gi)) ids.add(m[1].toLowerCase());
}
console.log([...ids].join("\n"));
