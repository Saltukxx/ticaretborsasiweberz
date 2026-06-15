const res = await fetch("https://www.erzurumtb.org.tr/danismanimiz");
const h = await res.text();
for (const m of h.matchAll(/<img[^>]+>/gi)) console.log(m[0]);
