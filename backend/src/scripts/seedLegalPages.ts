/**
 * Seed legal pages + default contact info on corporate profile.
 * Run: node dist/scripts/seedLegalPages.js
 */
import { eq } from "drizzle-orm";
import { createPool, createDb } from "../db/connection.js";
import { loadConfig } from "../config.js";
import { corporateProfile, legalPages } from "../db/schema/index.js";
import { LEGAL_PAGE_SLUGS } from "../db/schema/site.js";
import { ensureCorporateProfile } from "../modules/corporate/corporate.admin.service.js";

const DRAFT_NOTE =
  "<p><em>Bu metin taslak niteliğindedir; hukuk birimi tarafından gözden geçirilmelidir.</em></p>";

const LEGAL_DEFAULTS: Record<
  (typeof LEGAL_PAGE_SLUGS)[number],
  { title: string; body: string }
> = {
  kvkk: {
    title: "KVKK Aydınlatma Metni",
    body: `${DRAFT_NOTE}<p>Erzurum Ticaret Borsası olarak kişisel verileriniz 6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında işlenmektedir. İletişim formu ve e-bülten kayıtlarında toplanan ad, e-posta, telefon ve mesaj içeriği yalnızca talebinize yanıt vermek ve hizmet sunmak amacıyla saklanır.</p><p>Web sitemizdeki <strong>Borsa Asistanı</strong> ve <strong>Kadayıf tarif sohbeti</strong> hizmetlerinde sorulan sorular, verilen yanıtlar, oturum kimliği, IP adresi, tarayıcı bilgisi (user-agent), referer ve dil tercihi; hizmet kalitesi, kötüye kullanımın önlenmesi, yasal yükümlülükler ve KVKK kapsamındaki hak taleplerinin yanıtlanması amacıyla kayıt altına alınır. Yapay zekâ yanıtları için Google Gemini API kullanılabilir; bu aktarım hizmetin sunulması için gereklidir.</p><p>IP adresi ve tarayıcı bilgisi kötüye kullanımın önlenmesi için sınırlı süre tutulabilir. Haklarınız için bilgi@etb.org.tr adresine başvurabilirsiniz.</p>`,
  },
  gizlilik: {
    title: "Gizlilik Politikası",
    body: `${DRAFT_NOTE}<p>Web sitemizi ziyaret ettiğinizde teknik loglar (IP, tarayıcı türü) güvenlik amacıyla işlenebilir. Çerez kullanımına ilişkin ayrıntılar Çerez Politikası sayfasında yer alır.</p><p>Üçüncü taraf hizmet sağlayıcılarına yalnızca yasal zorunluluk veya açık rızanız dahilinde veri aktarımı yapılır.</p>`,
  },
  cerez: {
    title: "Çerez Politikası",
    body: `${DRAFT_NOTE}<p>Sitemiz temel işlevler için zorunlu çerezler kullanabilir. Analitik veya pazarlama çerezleri kullanıldığında bu sayfa güncellenecektir.</p><p>Tarayıcı ayarlarınızdan çerezleri yönetebilirsiniz; bazı özellikler devre dışı kalabilir.</p>`,
  },
  erisilebilirlik: {
    title: "Erişilebilirlik Beyanı",
    body: `${DRAFT_NOTE}<p>Erzurum Ticaret Borsası web sitesi, mümkün olduğunca geniş kitleye erişilebilir olacak şekilde tasarlanmaktadır. Klavye navigasyonu, yeterli renk kontrastı ve anlamlı alternatif metinler hedeflenmektedir.</p><p>Erişilebilirlik ile ilgili geri bildirimlerinizi iletişim formu üzerinden iletebilirsiniz.</p>`,
  },
};

const DEFAULT_CONTACT = {
  address: "Muratpaşa Mah. Cemal Gürsel Cad. No: 13\nYakutiye / Erzurum",
  phone: "+90 442 234 56 78",
  fax: "+90 442 234 56 79",
  emailPrimary: "bilgi@etb.org.tr",
  emailSecondary: "uye@etb.org.tr",
  hours: "Pazartesi — Cuma\n08:30 — 17:30",
};

async function main() {
  const config = loadConfig();
  const pool = createPool(config);
  const db = createDb(pool);

  await ensureCorporateProfile(db);

  const [profile] = await db.select().from(corporateProfile).limit(1);
  if (profile && !profile.address) {
    await db
      .update(corporateProfile)
      .set({ ...DEFAULT_CONTACT, updatedAt: new Date() })
      .where(eq(corporateProfile.id, profile.id));
    console.log("Seeded default contact info on corporate profile.");
  }

  for (const slug of LEGAL_PAGE_SLUGS) {
    const [existing] = await db
      .select({ slug: legalPages.slug })
      .from(legalPages)
      .where(eq(legalPages.slug, slug))
      .limit(1);
    if (existing) continue;

    const def = LEGAL_DEFAULTS[slug];
    await db.insert(legalPages).values({
      slug,
      title: def.title,
      body: def.body,
      isPublished: true,
    });
    console.log(`Seeded legal page: ${slug}`);
  }

  await pool.end();
  console.log("Legal pages seed complete.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
