-- Eski sitedeki 9 proje sayfasının tam metinleri + body kolonu
-- İdempotent: tekrar çalıştırılabilir.

ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "body" text;

-- ── 1. Süt Sektörü Soğuk Zincir Kurulumu Projesi (tamamlanan) ───────────────
INSERT INTO "projects" (
  "slug", "title", "description", "body", "status", "field",
  "sort_order", "is_published", "created_by",
  "year", "impact", "result", "metric", "completed_at"
)
SELECT
  'sut-sektoru-soguk-zincir-kurulumu-projesi',
  'Süt Sektörü Soğuk Zincir Kurulumu Projesi',
  'Erzurum İli ekonomisi, tarıma ve özellikle hayvancılığa dayanmaktadır.',
  $body$
<p>Erzurum İli ekonomisi, tarıma ve özellikle hayvancılığa dayanmaktadır. Erzurum İli, yaklaşık 745 bin büyükbaş hayvan varlığı içerisinde yaklaşık 335 bin sağmal inek ile Türkiye'de Konya İl'inden sonra ikinci sırada yer almakta ve toplam süt üretimi bakımından yaklaşık 726 bin ton/yıl ile Türkiye genelinde üst sıralarda yer almaktadır.</p>
<p>Erzurum İl'inde, 2018 yılı itibarıyla onay işlemlerini tamamlamış olan 19 adet Süt İşletmesi bulunmaktadır. Bu işletmelerin kurulu kapasiteleri 58.600 ton/yıldır. Bu işletmeler tarafından yıl içerisinde bildirilen süt isleme miktarları ise 14.826 ton/yıldır ve söz konusu işletmelerin halihazırdaki kapasite kullanım oranları yaklaşık olarak %25 tir.</p>
<p>Buradan yola çıkılacak olursa, İl'de, çiğ sütün hijyen ölçüleri ve sanitasyon değerleri açısından istenen koşullarda toplanamaması, muhafaza edilememesi ve taşınamaması nedeniyle süt sektöründen beklenen ekonomik katma değer istenen düzeyde gerçekleşemediği görülmektedir. Yapılması planlanan, "Erzurum İli Süt Sektörü Soğuk Zincir Kurulumu Projesi"'nin uygulanması ile birlikte Erzurum İli süt sektörünün geleceği noktalar kısaca su şekilde ifade edilebilir:</p>
<ol>
<li>İl'de üretilen çiğ sütün hijyen ölçüleri ve sanitasyon değerleri açısından ulusal standartlara kavuşması sağlanacaktır.</li>
<li>Ulusal standartlara uygun olarak toplanan, saklanan ve taşınan sütün, işleyici piyasada Ulusal Süt Konseyi tarafından belirlenen asgari bedeller üzerinden alıcı bulması sağlanacaktır. Bu yolla, yetiştiriciler tarafından üretilen süt hak ettiği piyasa değerini bulacaktır.</li>
<li>Süt toplama ve isleme sektörlerinde piyasa bozucu faaliyetlerin önüne geçilecek ve alım-satım piyasalarındaki belirsizlikler ortadan kaldırılacaktır.</li>
<li>Artan çiğ süt fiyatlarından ötürü, basta civar mahalleler (köyler) olmak üzere kırsalda yasayan yetiştiricilerin refah seviyeleri yükselecek ve bu durum söz konusu yörelerdeki tarım-hayvancılık faaliyetlerini teşvik ederek kırsaldan-kent merkezlerine yönelmiş olan göçü tersine çevirecektir.</li>
<li>Proje kapsamında, Erzurum İl'inin tamamına yaygın bir şekilde düzenlenecek bilgilendirme ve eğitim faaliyetleri aracılığıyla yetiştiriciler, toplayıcılar ve işleyiciler nezdinde bakım-besleme, hijyen sanitasyon ve kalite-standardizasyon konularındaki farkındalık ve bilinç düzeyi artırılacaktır.</li>
<li>İl'deki çiğ sütün ulusal standartlarda ve sürdürülebilir olarak temin edilmesi ile birlikte, markalaşma konusunda yeterli altyapı oluşacak ve İl'in yüksek rakım odaklı marka değerinin ulusal ve uluslararası alım piyasalarında rekabet edebilme gücü arttırılacaktır.</li>
</ol>
<p>Projeye ait makine ekipman mal alımı 2019 yılında tamamlanmış olup yaklaşık 2 yıldır Erzurum merkez ilçelerine (Yakutiye, Palandöken, Aziziye) ait 33 köyde 290 üreticiden çiğ süt alınıp talep eden mandıralara ulaştırılmaktadır.</p>
<p>Erzurum Tarım ve Hayvancılık A.Ş. bünyesinde çalışan personeller tarafından yaz aylarında her gün, kış aylarında ise 2 günde bir sütlerin kalite analizleri (pH, Yağ, Protein vs.) yapılarak üreticiden alınmaktadır.</p>
$body$,
  'completed',
  'Hayvancılık',
  1,
  true,
  (SELECT "id" FROM "admins" ORDER BY "created_at" ASC LIMIT 1),
  '2019',
  '33 köyde 290 üreticiden çiğ süt toplama ve mandıralara ulaştırma',
  'Soğuk zincir altyapısı 2019 yılında devreye alındı; kalite analizleriyle sürdürülmektedir.',
  '{"value":"290","label":"Üretici"}'::jsonb,
  '2019-12-31'
WHERE EXISTS (SELECT 1 FROM "admins" LIMIT 1)
ON CONFLICT ("slug") DO NOTHING;

-- ── 2. Lisanslı Depoculuk Projesi ────────────────────────────────────────────
INSERT INTO "projects" (
  "slug", "title", "description", "body", "status", "field",
  "sort_order", "is_published", "created_by"
)
SELECT
  'lisansli-depoculuk-projesi',
  'Lisanslı Depoculuk Projesi',
  'İlimizde 40 bin ton kapasiteli Lisanslı Depo Projesi için çalışmalarımızı bitirmek üzereyiz.',
  $body$
<p>İlimizde 40 bin ton kapasiteli Lisanslı Depo Projesi için çalışmalarımızı bitirmek üzereyiz. Projemizin 2025 yılının sonunda hayata geçmesi ile</p>
<ol>
<li>Tarım ürünleri ticaretini ve depolanmasını kolaylaştırmak</li>
<li>Ürün sahiplerinin mallarının emniyetini sağlamak ve kalitesini korumak,</li>
<li>Ürünlerin sınıf ve derecelerinin yetkili sınıflandırıcılar tarafından saptanmasını sağlamak,</li>
<li>Tarım ürünleri lisanslı depo işleticilerinin kişiler arasında ayrım yapmaksızın tarım ürünlerini kabul etmelerini temin etmek,</li>
<li>Ürünlerin mülkiyetini temsil eden ve finansmanını, satışını ve teslimini sağlayan ürün senedi çıkartmak ve standartları belirlenmiş tarım ürünlerinin ticaretini geliştirmek amaçlanmaktadır.</li>
</ol>
$body$,
  'ongoing',
  'Depoculuk & Lojistik',
  2,
  true,
  (SELECT "id" FROM "admins" ORDER BY "created_at" ASC LIMIT 1)
WHERE EXISTS (SELECT 1 FROM "admins" LIMIT 1)
ON CONFLICT ("slug") DO NOTHING;

-- ── 3. Organik Mera Projesi ──────────────────────────────────────────────────
INSERT INTO "projects" (
  "slug", "title", "description", "body", "status", "field",
  "sort_order", "is_published", "created_by"
)
SELECT
  'organik-mera-projesi',
  'Organik Mera Projesi',
  'Bölgemizde var olan potansiyelin bilincinde olarak ilde üretilen ürünlerin organik hale getirilmesi hedeflenmektedir.',
  $body$
<p>Bölgemizde var olan potansiyelin bilincinde olarak;</p>
<ol>
<li>Şehrin rakım yüksekliği,</li>
<li>Şehirde sanayi tesislerinin az olması,</li>
<li>Bitki florasının zenginliği,</li>
<li>Doğal su kaynakları,</li>
<li>Hayvan varlığı,</li>
<li>İldeki toplam arazi varlığının %64 ünün çayır mera alanı olması gibi faktörlerin tüm avantajlarını kullanarak ilde üretilen ürünlerin organik hale getirerek şehir ve ülke ekonomisine katkı sağlamayı hedefliyoruz.</li>
</ol>
<p>Proje ile ilgili Atatürk Üniversitesi Turizm Fakültesi Ziraat Fakültesi ile çalışmalarımız devam etmektedir.</p>
$body$,
  'ongoing',
  'Tarım',
  3,
  true,
  (SELECT "id" FROM "admins" ORDER BY "created_at" ASC LIMIT 1)
WHERE EXISTS (SELECT 1 FROM "admins" LIMIT 1)
ON CONFLICT ("slug") DO NOTHING;

-- ── 4. Örnek Turizm Köyü Projesi ─────────────────────────────────────────────
INSERT INTO "projects" (
  "slug", "title", "description", "body", "status", "field",
  "sort_order", "is_published", "created_by"
)
SELECT
  'ornek-turizm-koyu-projesi',
  'Örnek Turizm Köyü Projesi',
  'Projenin uygulanacağı köyün Turizm ve Gastronomi anlamında öne çıkan lezzetlerinin kendi bünyesinde üretip pazarlanabilecek duruma gelmesi amaçlanmaktadır.',
  $body$
<p>Projenin uygulanacağı köyün Turizm ve Gastronomi anlamında öne çıkan lezzetlerinin kendi bünyesinde üretip pazarlanabilecek duruma gelmesi amaçlanmaktadır. Akabinde köyde üretilen ürünlerin markalaşma çalışmaları yapılarak pazarlama ve tanıtım faaliyetleri yapılması hedeflenmektedir.</p>
<p>Projenin gerçekleşmesi halinde ilde eko turizmin etkin hale gelmesi, Şehre göçün önüne geçilmesi, yerel bir marka oluşturulması amaçlanmaktadır.</p>
$body$,
  'ongoing',
  'Gastronomi & Turizm',
  4,
  true,
  (SELECT "id" FROM "admins" ORDER BY "created_at" ASC LIMIT 1)
WHERE EXISTS (SELECT 1 FROM "admins" LIMIT 1)
ON CONFLICT ("slug") DO NOTHING;

-- ── 5. Bitki Örtüsü Haritası Projesi ─────────────────────────────────────────
INSERT INTO "projects" (
  "slug", "title", "description", "body", "status", "field",
  "sort_order", "is_published", "created_by"
)
SELECT
  'bitki-ortusu-haritasi-projesi',
  'Bitki Örtüsü Haritası Projesi',
  'Paydaşlarımızla iş birliği yaparak ilçe bazlı bitki örtüsü haritasının oluşturulması amaçlanmaktadır.',
  $body$
<p>Tarım ve Hayvancılık alanında yapılan birçok çalışmamamızda ilimizdeki bitki örtüsü haritasının tam anlamıyla oluşturulmadığı gözlenmiştir. Bu kapsamda paydaşlarımızla iş birliği yaparak ilçe bazlı bitki örtüsü haritasının oluşturulması amaçlanmaktadır.</p>
$body$,
  'ongoing',
  'Tarım',
  5,
  true,
  (SELECT "id" FROM "admins" ORDER BY "created_at" ASC LIMIT 1)
WHERE EXISTS (SELECT 1 FROM "admins" LIMIT 1)
ON CONFLICT ("slug") DO NOTHING;

-- ── 6. Gastro Akademi Projesi ────────────────────────────────────────────────
INSERT INTO "projects" (
  "slug", "title", "description", "body", "status", "field",
  "sort_order", "is_published", "created_by"
)
SELECT
  'gastro-akademi-projesi',
  'Gastro Akademi Projesi',
  'Yerelde gastronomi bilincini oluşturmak ve kalifiye eleman yetiştirmek amacıyla Gastro Akademi projesi geliştirilmiştir.',
  $body$
<p>Turizm'in en önemli çalışmaların başında Gastronomi faaliyetler gelmektedir. İlimizin yöresel yemekleri turizmin bir bileşenidir. Özellikle son yıllarda coğrafi işaret sayımızın artması gastronomi turizmi kapsamında yapılacak faaliyetleri beraberinde getirmiştir. Bu faaliyetlerin başında ise öncelikle yerelde bu bilinci oluşturmak, küçük yaşta usta yetiştirmek, Restoran, Lokanta ve Otellerimizin bu yöresel ürünleri servis edebilecek, tanıtacak seviyeye getirmek gerekmektedir.</p>
<p>Bu kapsamda Gastro Akademi proje geliştirilmiştir. Atatürk Üniversitesi Turizm Fakültesi Gastronomi Bölümü projemizin paydaşı olarak yer almaktadır. Proje kapsamında hazırlanan eğitim müfredatını Fakülte hocalarımızın vermesi planlanmıştır. Eğitim süresi sonunda ATASEM tarafından sınav yapılarak sertifikalandırma programı hazırlanmıştır. Projemiz 2023 yılında Kuzeydoğu Anadolu Kalkınma Ajansına (KUDAKA) sunulmuş fakat kabul edilmemiştir. İlerleyen süreçte proje revize edilip başvurusu tekrar yapılacaktır</p>
<p>Projeden Beklenen sonuçlar:</p>
<ol>
<li>Erzurum'da Gastronomi kavramının öğrenilmesini sağlamak.</li>
<li>Hizmet sektöründe çalışacak gençlerin (Servis Personeli, Mutfak Personeli, Aşcı vs.) gastronomi bilinciyle yetiştirilmesini sağlamak,</li>
<li>Yöresel lezzetlerimizin servis edileceği işletmelerin sayısının artırılması,</li>
<li>İşletmelerin kolaylıkla kalifiye eleman bulabilmesini sağlamak,</li>
<li>Erzurum adına alınan coğrafi işaretli yöresel ürün ve yemeklerimizin satıldığı ve servis edildiği işletmelerin sayısının artması,</li>
<li>Erzurum'da Gastronomi Turizmin gelişmesini sağlamak.</li>
</ol>
$body$,
  'ongoing',
  'Gastronomi & Turizm',
  6,
  true,
  (SELECT "id" FROM "admins" ORDER BY "created_at" ASC LIMIT 1)
WHERE EXISTS (SELECT 1 FROM "admins" LIMIT 1)
ON CONFLICT ("slug") DO NOTHING;

-- ── 7. Gastronomi Lisesi Projesi ─────────────────────────────────────────────
INSERT INTO "projects" (
  "slug", "title", "description", "body", "status", "field",
  "sort_order", "is_published", "created_by"
)
SELECT
  'gastronomi-lisesi-projesi',
  'Gastronomi Lisesi Projesi',
  'Gastronomi alanında meslek ve teknik liselerin açılması ile Akademik eğitimlerin lise dönemine indirgenmesi hedeflenmektedir.',
  $body$
<p>Gastronomi alanında meslek ve teknik liselerin açılması ile Akademik eğitimlerin lise dönemine indirgenmesi hedeflenmektedir. Beceri eğitimlerinin geliştirilmesi ile Üniversiteye hazırlık imkânı sağlanacağı düşünülmektedir. Doğrudan turizm sektörümüzü etkileyecek bir proje olacağı düşünülmektedir.</p>
$body$,
  'ongoing',
  'Gastronomi & Turizm',
  7,
  true,
  (SELECT "id" FROM "admins" ORDER BY "created_at" ASC LIMIT 1)
WHERE EXISTS (SELECT 1 FROM "admins" LIMIT 1)
ON CONFLICT ("slug") DO NOTHING;

-- ── 8. Lezzet Haritası Projesi ───────────────────────────────────────────────
INSERT INTO "projects" (
  "slug", "title", "description", "body", "status", "field",
  "sort_order", "is_published", "created_by"
)
SELECT
  'lezzet-haritasi-projesi',
  'Lezzet Haritası Projesi',
  'Erzurum''un gastronomi kenti olması yolundaki çalışmalarımızda lezzet haritası oluşturmak ve bunu materyal haline getirmeyi planlamaktayız.',
  $body$
<p>Erzurum'un gastronomi kenti olması yolundaki çalışmalarımız da Lezzet haritası oluşturmak ve bunu materyal haline getirmeyi planlamaktayız. Gastronomi turizminde ana faktör olan Turistlerin doğru bir mekanizma ile seyahat etmelerini sağlamak ilin tüm kültürel değerlerini yaşayarak şehrimize veda etmelerini sağlamak amaçlanmaktadır.</p>
$body$,
  'ongoing',
  'Gastronomi & Turizm',
  8,
  true,
  (SELECT "id" FROM "admins" ORDER BY "created_at" ASC LIMIT 1)
WHERE EXISTS (SELECT 1 FROM "admins" LIMIT 1)
ON CONFLICT ("slug") DO NOTHING;

-- ── 9. Arı Köy Projesi ───────────────────────────────────────────────────────
INSERT INTO "projects" (
  "slug", "title", "description", "body", "status", "field",
  "sort_order", "is_published", "created_by"
)
SELECT
  'ari-koy-projesi',
  'Arı Köy Projesi',
  'Erzurum zengin flora yapısı ve geniş çayır-mera alanları ile arıcılık konusunda önemli bir potansiyele sahiptir.',
  $body$
<p>Erzurum zengin flora yapısı ve geniş çayır-mera alanları ile arıcılık konusunda önemli bir potansiyele sahiptir.</p>
<p>Bu potansiyelin en yüksek ve en verimli olan bölgenin fizibilite çalışması yapılarak arıcılığın geliştirilmesi, köydeki kadınların projeye dahil edilerek kaliteli ürün elde edilmesi ve ürünün markalaşma çalışması yapılması planlanmaktadır</p>
$body$,
  'ongoing',
  'Hayvancılık',
  9,
  true,
  (SELECT "id" FROM "admins" ORDER BY "created_at" ASC LIMIT 1)
WHERE EXISTS (SELECT 1 FROM "admins" LIMIT 1)
ON CONFLICT ("slug") DO NOTHING;
