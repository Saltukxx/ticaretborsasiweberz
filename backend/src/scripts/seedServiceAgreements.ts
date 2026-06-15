/**
 * Üye anlaşmalarını service_agreements tablosuna yükler.
 * Run: npx tsx src/scripts/seedServiceAgreements.ts
 */
import { eq } from "drizzle-orm";
import { createPool, createDb } from "../db/connection.js";
import { loadConfig } from "../config.js";
import { serviceAgreements } from "../db/schema/index.js";

const AGREEMENTS = [
  {
    slug: "aytemiz-petrol",
    title: "Aytemiz Petrol",
    category: "akaryakit",
    sortOrder: 0,
    summary:
      "Kredi kartı %7, DBS %4 ve bayi alımlarında %4 indirimli akaryakıt — tüm Aytemiz istasyonlarında geçerli.",
    body: `<p>Erzurum Ticaret Borsası olarak, üyelerimizin işletmeleri üzerine kayıtlı araçlarına yönelik indirimli akaryakıt almaları için Aytemiz Akaryakıt A.Ş. Genel Müdürlüğü ile <strong>kredi kartı için %7, DBS için %4, bayilerden %4 indirimli akaryakıt uygulanması sağlanmıştır.</strong></p>
<p>Uygulama, ülke genelindeki tüm AYTEMİZ istasyonlarında geçerli olacaktır.</p>
<p>Gerekli evraklar:</p>
<ol>
<li><strong>İşletmeye ait vergi levhası</strong></li>
<li><strong>İmza sirküleri veya beyannamesi</strong></li>
<li><strong>Faaliyet belgesi</strong></li>
<li><strong>Sicil gazetesi</strong></li>
<li><strong>Yetkili kişi adı soyadı, irtibat numarası ve e-posta bilgileri</strong></li>
</ol>`,
  },
  {
    slug: "petrol-ofisi",
    title: "Petrol Ofisi",
    category: "akaryakit",
    sortOrder: 10,
    summary:
      "Peşin, kredi kartı veya aylık fatura karşılığı alımlarda %2,5 indirimli akaryakıt — tüm PO istasyonlarında.",
    body: `<p>Erzurum Ticaret Borsası olarak, üyelerimizin işletmeleri üzerine kayıtlı araçlarına yönelik indirimli akaryakıt almaları için Petrol Ofisi A.Ş. Genel Müdürlüğü ile <strong>%2,5 indirimli akaryakıt uygulanması sağlanmıştır.</strong></p>
<p><strong>Uygulama, peşin / kredi kartı veya aylık fatura karşılığı alımlarda ve ülke genelindeki tüm PO istasyonlarında geçerli olacaktır.</strong></p>
<p>Gerekli evraklar:</p>
<ol>
<li><strong>İşletmeye ait vergi levhası</strong></li>
<li><strong>İmza sirküleri veya beyannamesi</strong></li>
<li><strong>Tahakkuk fişi (her ay ödenen KDV makbuzu) veya sicil gazetesi plaka bilgileri</strong></li>
<li><strong>Yakıt tipi ve faturaların gönderilmesi için e-posta adresi</strong></li>
<li><strong>Yetkili kişi adı soyadı, irtibat numarası ve e-posta bilgileri</strong></li>
</ol>`,
  },
  {
    slug: "dhl-ecommerce",
    title: "DHL eCommerce",
    category: "kargo",
    sortOrder: 20,
    summary:
      "Üyelerimiz indirimli kargo gönderimi için Borsadan Üye Sicil Belgesi almaları yeterlidir.",
    body: `<p>Erzurum Ticaret Borsası olarak, üyelerimizin işletmeleri üzerinden indirimli şekilde kargo gönderimlerini gerçekleştirebilmeleri için DHL eCommerce ile protokol imzalanmıştır.</p>
<p>Kampanyadan yararlanmak isteyen üyelerimizin Borsamızdan <strong>Üye Sicil Belgesi</strong> almaları yeterlidir.</p>`,
  },
  {
    slug: "aras-kargo",
    title: "Aras Kargo",
    category: "kargo",
    sortOrder: 30,
    summary:
      "Erzurum merkez şubelerinde geçerli indirimli kargo — Üye Sicil Belgesi ile faydalanılır.",
    body: `<p>Erzurum Ticaret Borsası olarak, üyelerimizin işletmeleri aracılığıyla indirimli kargo gönderimleri gerçekleştirebilmeleri amacıyla Aras Kargo ile bir protokol imzalanmıştır.</p>
<p><strong>İndirimli fiyatlar, yalnızca Erzurum merkez şubelerinde ve gönderimler için geçerlidir.</strong></p>
<p>Kampanyadan yararlanmak isteyen üyelerimizin Borsamızdan <strong>Üye Sicil Belgesi</strong> almaları yeterlidir.</p>`,
  },
  {
    slug: "mgc-i-elbiseleri",
    title: "MGC İş Elbiseleri",
    category: "giyim",
    sortOrder: 40,
    summary:
      "Personel iş elbiselerinde %15 indirim — MGC İş Elbiseleri (Şenyurt Topal) protokolü.",
    body: `<p>Erzurum Ticaret Borsası olarak <strong>MGC İş Elbiseleri (Şenyurt Topal)</strong> arasında düzenlenen protokol çerçevesinde borsamız üyeleri işletmelerinde personelleri için kullanacakları iş elbiselerini <strong>%15 indirimli</strong> temin edebileceklerdir.</p>
<p>İrtibat:</p>
<ul>
<li><strong>MGC İş Elbiseleri Şenyurt Topal</strong></li>
<li><strong>Tel: 0533 683 25 25</strong></li>
<li><strong>E-posta: mgc@mgciselbiseleri.com</strong></li>
</ul>`,
  },
  {
    slug: "gne-optik",
    title: "Güneş Optik",
    category: "optik",
    sortOrder: 50,
    summary:
      "Üye, personel ve yakınları %60'a varan indirim — Muratpaşa, eski Palandöken Hastanesi arkası.",
    body: `<p>Erzurum Ticaret Borsası olarak Güneş Optik arasında düzenlenen protokol çerçevesinde <strong>üye, personel ve yakınları %60'a varan indirim avantajından yararlanabilecek.</strong></p>
<p><strong>İletişim:</strong> 0536 578 46 25</p>
<p><strong>Adres:</strong> Muratpaşa Mahallesi eski Palandöken Hastanesi arkası Güneş Optik</p>`,
  },
  {
    slug: "saygn-optik",
    title: "Saygın Optik",
    category: "optik",
    sortOrder: 60,
    summary:
      "Optik ve güneş gözlüklerinde %30 indirim; 1 yıl ücretsiz bakım kampanyası.",
    body: `<p>Erzurum Ticaret Borsası ile Saygın Optik arasında yapılan protokol ile üyeleri, personeli ve yakınları <strong>optik ve güneş gözlüklerinde %30 indirim</strong> ayrıca 1 yıl boyunca optik ve güneş gözlüklerinin <strong>ücretsiz bakım kampanyasından</strong> faydalanacak.</p>
<p><strong>İletişim:</strong> 0442 237 12 12</p>
<p><strong>Adres:</strong> Muratpaşa Mahallesi eski Palandöken Hastanesi arkası Saygın Optik</p>`,
  },
] as const;

async function main() {
  const config = loadConfig();
  const pool = createPool(config);
  const db = createDb(pool);

  try {
    for (const item of AGREEMENTS) {
      const [existing] = await db
        .select({ id: serviceAgreements.id })
        .from(serviceAgreements)
        .where(eq(serviceAgreements.slug, item.slug))
        .limit(1);

      if (existing) {
        await db
          .update(serviceAgreements)
          .set({
            title: item.title,
            summary: item.summary,
            body: item.body,
            category: item.category,
            sortOrder: item.sortOrder,
            isPublished: true,
            updatedAt: new Date(),
          })
          .where(eq(serviceAgreements.id, existing.id));
        console.log(`Updated: ${item.slug}`);
      } else {
        await db.insert(serviceAgreements).values({
          slug: item.slug,
          title: item.title,
          summary: item.summary,
          body: item.body,
          category: item.category,
          sortOrder: item.sortOrder,
          isPublished: true,
        });
        console.log(`Inserted: ${item.slug}`);
      }
    }
    console.log(`Done — ${AGREEMENTS.length} agreements seeded.`);
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
