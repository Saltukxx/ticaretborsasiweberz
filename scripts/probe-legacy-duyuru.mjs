const urls = [
  "https://www.erzurumtb.org.tr/news?type=duyuru",
  "https://www.erzurumtb.org.tr/news?type=duyuru&page=1",
  "https://www.erzurumtb.org.tr/news/?type=duyuru&page=1",
];
for (const url of urls) {
  const html = await fetch(url).then((r) => r.text());
  const ids = [...html.matchAll(/\/news\/([a-f0-9]{24})/gi)].map((m) => m[1]);
  const duyuru = (html.match(/Duyuru/gi) ?? []).length;
  console.log(url, "ids", new Set(ids).size, "duyuru mentions", duyuru);
}
