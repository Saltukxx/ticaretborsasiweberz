const id = "6a1eed09103fd79a5f5392ff";
const html = await (await fetch(`https://www.erzurumtb.org.tr/news/${id}`)).text();
console.log("haber tag", [...html.matchAll(/Haber|Duyuru/g)].slice(0, 10).map((m) => m[0]));
const article = html.match(/<article class="prose[^"]*"[^>]*>([\s\S]*?)<\/article>/i);
console.log("article len", article?.[1]?.length);
console.log(article?.[1]);

// list card for category
const list = await (await fetch("https://www.erzurumtb.org.tr/news/?page=6")).text();
const block = list.match(new RegExp(id + "[\\s\\S]{0,1200}"));
console.log("\nlist block:\n", block?.[0]);
