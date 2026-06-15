import * as cheerio from "cheerio";
const html = await (await fetch("https://www.erzurumtb.org.tr/news/?page=1")).text();
const $ = cheerio.load(html);
const cards: { id: string; title: string; cat: string }[] = [];
$('a[href^="/news/"]').each((_, el) => {
  const href = $(el).attr("href") ?? "";
  const m = href.match(/\/news\/([a-f0-9]+)/);
  if (!m) return;
  const card = $(el).closest("article, div").first();
  const cat = card.find("span").filter((_, s) => /Haber|Duyuru/.test($(s).text())).first().text().trim();
  cards.push({ id: m[1], title: $(el).text().trim().slice(0, 60), cat });
});
console.log(cards.slice(0, 5));
console.log("total links", cards.length);
