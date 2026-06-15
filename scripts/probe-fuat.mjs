const h = await (await fetch("https://www.erzurumtb.org.tr/boards/684be22bf6f8419e31262ebd")).text();
const m = h.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
const data = JSON.parse(m[1]);
const fuat = data.mainEntity.member.find(x => x.name.includes("Fuat"));
console.log(fuat);
