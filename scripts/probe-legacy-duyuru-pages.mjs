const base = "https://www.erzurumtb.org.tr/news?type=duyuru";
const all = new Set();
for (let page = 1; page <= 20; page += 1) {
  const html = await fetch(`${base}&page=${page}`).then((r) => r.text());
  const ids = [...html.matchAll(/\/news\/([a-f0-9]{24})/gi)].map((m) => m[1].toLowerCase());
  if (ids.length === 0) {
    console.log("page", page, "empty");
    break;
  }
  for (const id of ids) all.add(id);
  console.log("page", page, "found", ids.length, "total", all.size);
}
console.log("unique", all.size);
