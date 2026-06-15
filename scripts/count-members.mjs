const boards = [
  ["yk", "684be8dd43fdfcdc3a431da1"],
  ["meclis", "680c9aca950a44d145ac33ad"],
  ["tobb", "684be97d43fdfcdc3a431dc1"],
  ["personel", "684be22bf6f8419e31262ebd"],
];
for (const [label, id] of boards) {
  const h = await (await fetch(`https://www.erzurumtb.org.tr/boards/${id}`)).text();
  const m = h.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  const data = JSON.parse(m[1]);
  console.log(label, data.mainEntity.member.length);
}
