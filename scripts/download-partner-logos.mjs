/**
 * Eski siteden kurumsal iş ortakları logolarını indirir.
 * Run: node scripts/download-partner-logos.mjs
 */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, "..", "public", "partners");
const BASE = "https://www.erzurumtb.org.tr/img";

const PARTNERS = [
  { file: "l1.png", src: "l1.png", alt: "Partner 1" },
  { file: "l2.png", src: "l2.png", alt: "Partner 2" },
  { file: "l4.png", src: "l4.png", alt: "Partner 3" },
  { file: "l5.png", src: "l5.png", alt: "Partner 4" },
  { file: "l6.png", src: "l6.png", alt: "Partner 5" },
  { file: "l7.png", src: "l7.png", alt: "Partner 6" },
  { file: "abigem.png", src: "ABİGEM.png", alt: "ABİGEM" },
  { file: "ata-teknokent.png", src: "ATA TEKNOKENT.png", alt: "ATA TEKNOKENT" },
  { file: "erzurum-carsi-pazar.png", src: "ERZURUM ÇARŞI PAZAR.png", alt: "Erzurum Çarşı Pazar" },
  { file: "gumruk-ve-turizm.png", src: "GÜMRÜK VE TURİZM İŞLETMELERİ.png", alt: "Gümrük ve Turizm İşletmeleri" },
  { file: "iso-9000.png", src: "ISO 9000.png", alt: "ISO 9000" },
  { file: "icn.png", src: "international certification network.png", alt: "International Certification Network" },
  { file: "kobi.png", src: "KOBİ.png", alt: "KOBİ" },
  { file: "kgf.png", src: "KREDİ GARANTİ FONU.png", alt: "Kredi Garanti Fonu" },
  { file: "lisansli-depoculuk.png", src: "LİSANSLI DEPOCULUK.png", alt: "Lisanslı Depoculuk" },
  { file: "mezopotamya.png", src: "MEZOPOTAMYA.png", alt: "Mezopotamya" },
  { file: "mupak.png", src: "MÜPAK.png", alt: "MÜPAK" },
  { file: "tarim-ve-hayvancilik.png", src: "TARIM VE HAYVANCILIK.png", alt: "Tarım ve Hayvancılık" },
  { file: "turib.png", src: "TÜRİB.png", alt: "TÜRİB" },
  { file: "yorez.png", src: "YÖREZ.png", alt: "YÖREZ" },
];

await mkdir(OUT_DIR, { recursive: true });

let ok = 0;
let fail = 0;

for (const p of PARTNERS) {
  const url = `${BASE}/${encodeURIComponent(p.src).replace(/%2F/g, "/")}`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 100) throw new Error("too small");
    await writeFile(join(OUT_DIR, p.file), buf);
    console.log(`OK  ${p.file}`);
    ok += 1;
  } catch (err) {
    console.error(`FAIL ${p.file}: ${err.message}`);
    fail += 1;
  }
}

console.log(`Done — ${ok} saved, ${fail} failed.`);
