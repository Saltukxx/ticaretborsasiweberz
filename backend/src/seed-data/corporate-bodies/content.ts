/**
 * Kurumsal belge sayfa içerikleri — PDF kaynaklarından düzenlenmiş HTML.
 * seedCorporateBodies.ts ile veritabanına yazılır.
 */

const SIGN = `<div class="corp-doc-page__sign"><p>Onaylayan</p><strong>Yıldırım Hakan ORAL</strong><p>Yönetim Kurulu Başkanı</p></div>`;

export const CORPORATE_BODY_BY_SLUG: Record<string, string> = {
  "borsa-tarihce": `
<h2>Kuruluş ve Misyon</h2>
<p>Erzurum Ticaret Borsası, 5174 sayılı Kanun'da yazılı esaslar dairesinde <strong>15 Aralık 1946</strong> tarihinde kurulmuş olup, kurulduğu günden bugüne kadar borsacılık faaliyetlerini kesintisiz sürdürmüştür.</p>
<p>Günümüzde gerçek borsa kurallarının uygulandığı, bölgemizin önemli tarımsal ürünlerinin pazarlandığı, deneyimi ve projeleriyle Türk ekonomisine ve bölge ekonomisine yön veren borsalar arasında yer almaktadır.</p>

<h2>Organizasyon ve Görevler</h2>
<p>Genel Sekreterliğe bağlı olarak Muamelat ve Kararlar, Mali ve İdari İşler, Tescil İşleri, Tartı İşleri, Özel Gıda Kontrol Laboratuvarı, Basın Danışmanı ve Hukuk Müşavirlik kadroları yer almaktadır. 5174 sayılı Türkiye Odalar ve Borsalar Birliği ile Odalar ve Borsalar Kanunu'nda belirtilen görevler borsamızda eksiksiz yerine getirilmektedir.</p>

<h2>Hizmet Anlayışımız</h2>
<p>1000 m² üzerine yapılmış borsa binasında 23 personelimizle hizmet vermekteyiz. Kalitenin sürekli iyileştirilmesi ve müşteri memnuniyetinin en üst düzeyde tesis edilmesi için modern altyapımız ve tüm çalışanlarımızla hizmetlerimizi hatasız ve hızlı bir şekilde üyelerimize sunmayı; onların istek, ihtiyaç ve beklentileri doğrultusunda faaliyetlerimizi devamlı iyileştirerek sürdürmeyi amaç edinmiş bulunmaktayız.</p>

<div class="corp-timeline">
  <div class="corp-timeline__item">
    <span class="corp-timeline__year">1946</span>
    <div class="corp-timeline__content">
      <h3>Kuruluş</h3>
      <p>Erzurum Ticaret Borsası resmen faaliyete geçti.</p>
    </div>
  </div>
  <div class="corp-timeline__item">
    <span class="corp-timeline__year">1956</span>
    <div class="corp-timeline__content">
      <h3>Kantar Birimi</h3>
      <p>Yüksek tonajlı araçların ve emtiaların tartımı için kantar birimimiz kuruldu. Kantarlarımızın kalibrasyonları iki yılda bir Bilim, Sanayi ve Teknoloji Müdürlüğünce yaptırılmaktadır.</p>
    </div>
  </div>
  <div class="corp-timeline__item">
    <span class="corp-timeline__year">1999</span>
    <div class="corp-timeline__content">
      <h3>Gıda Laboratuvarı</h3>
      <p>Erzurum Ticaret Borsası Gıda ve Yem Kalite Kontrol Laboratuvarı, 2 gıda mühendisi ve 1 Numune Kabul ve Raporlama Sorumlusu ile üyelerimize hizmet vermektedir.</p>
    </div>
  </div>
</div>

<h2>Altyapı ve Akreditasyon</h2>
<p>Borsamız bünyesinde 1 kantar ve 1 laboratuvar bulunmaktadır. Laboratuvarımız <strong>TS EN ISO 17025</strong> Laboratuvar Akreditasyon Sistemine haizdir. Borsamız ayrıca <strong>TS EN ISO 9001:2015</strong> Kalite Yönetim Sistemi ve <strong>ISO 10002:2015</strong> Müşteri Memnuniyeti belgelerine sahiptir.</p>
<p>TOBB Akreditasyonuna sahip olup C sınıfındayız; A sınıfına yükselmek için çalışmalarımız devam etmektedir.</p>
${SIGN}`.trim(),

  "etik-kurallar": `
<p>Erzurum Ticaret Borsası organ üyeleri, çalışanları, ETB'yi temsil edenler; üyelerle, birbirleriyle ve üçüncü kişilerle olan ilişkilerinde aşağıdaki etik kurallar doğrultusunda hareket ederler.</p>

<h2>Etik İlkelerimiz</h2>
<ul class="corp-principles">
  <li><strong>Yasalara Uygunluk ve Adil Hizmet</strong><p>Her türlü çalışma yasalara uygun bir şekilde, genellik ve eşitlik değerlerine dikkat edilerek adil bir şekilde yapılır.</p></li>
  <li><strong>Görevin Yerine Getirilmesinde Kamu Hizmeti Bilinci</strong><p>Anayasal ve kamu niteliğinde meslek örgütü yapılanması olma bilinci ile çalışılır.</p></li>
  <li><strong>Misyon ve Değerlere Bağlılık</strong><p>Her türlü hizmet ve çalışmalarda oda misyonuna ve değerlerine hizmet edecek şekilde davranılır.</p></li>
  <li><strong>Üye Hizmet Bilinci ve Müşteri Memnuniyeti</strong><p>Üyelerin menfaati için kurulmuş olma bilinci ile müşteri memnuniyeti odaklı üye hizmet bilinci ile her türlü çalışma yapılır.</p></li>
  <li><strong>Saygınlık, Nezaket ve Güven</strong><p>İlişkiler, karşılıklı saygı içerisinde, itibar ve güveni sağlayacak şekilde, nezaket kuralları çerçevesinde yürütülür.</p></li>
  <li><strong>Pozitif Çözüm Odaklı Yaklaşım</strong><p>Tavır ve davranışlarda yapıcı yaklaşımlar sergilenir, çözüm odaklı faaliyetler yapılır.</p></li>
  <li><strong>Dürüstlük, Tarafsızlık ve Gizlilik</strong><p>Yapılan işte dürüst ve tarafsız davranılır. Görev süresince ve görev sona erdikten sonra kurumsal ve kişisel bilgiler ile ilgili gizlilik esas alınır.</p></li>
  <li><strong>Bilgi Verme, Saydamlık</strong><p>Her aşamada saydamlığa özen gösterilir; bilgiye ulaşma sağlanır ve bilgi paylaşımı yapılır.</p></li>
  <li><strong>Fırsat Eşitliği</strong><p>Her türlü görevlendirme, istihdam ve kişisel gelişimde fırsat eşitliği sağlanır. Hiçbir konuda ayrımcılık yapılmaz.</p></li>
  <li><strong>Fikri ve Sınai Mülkiyet Haklarına Saygı</strong><p>Zihinsel yaratıcılığın ortaya koyduğu tüm fikri ve sınai mülkiyet haklarına saygı gösterilir.</p></li>
  <li><strong>Görev ve Yetkilerin Menfaat Amacıyla Kullanılmaması</strong><p>Tarafsız değerlendirmelerde bulunarak çıkar çatışmalarına girmeden görevler yerine getirilir; şahsi çıkarlar konusunda dikkatli davranılır.</p></li>
  <li><strong>Savurganlıktan Kaçınma</strong><p>Her türlü malzeme, makine, donanım ve taşıtlar yalnızca iş amaçlı kullanılır; enerji, zaman ve kaynak israfından kaçınılır.</p></li>
</ul>
${SIGN}`.trim(),

  "bilgi-iletisim-politikasi": `
<p>Erzurum Ticaret Borsası bilgi ve iletişim politikasının amacı; güçlü kurumsal altyapısıyla borsacılık işlemlerinde sektörel gelişmeleri ve teknolojik yenilikleri takip ederek üyelerine ve paydaşlarına dünya standartlarında kaliteli hizmet vermek, üyelerinin mesleki etkinliklerini kolaylaştırmak, kurumsal gelişimlerini desteklemek ve kurumumuzda bilgi iletişimi, depolanması, işlenmesi ve güvenliğini sağlamaktır.</p>

<h2>Hedefimiz</h2>
<p>Erzurum Ticaret Borsası'nın istikrarlı büyümesi ve alanında uluslararası kimliğe ulaşması için sunacağımız hizmet anlayışında <strong>kaliteyi kılavuz edinmek</strong>, kalite düzeyini gelişen teknoloji doğrultusunda artırmak, oluşabilecek risklere karşı önlem almak ve sürdürülebilir bir sistem kurmak temel hedefimizdir.</p>
${SIGN}`.trim(),

  "kurumsal-risk-politikasi": `
<p>Borsanın her biriminin gerçekleştirdiği çalışmalara istinaden kurumsal risk analizi gerçekleştirilmiştir. Kurumsal risk analizi, borsa süreçlerinin iyileştirilmesi ve risklerin tolere edilmesi, önlenmesi, en aza indirgenmesi ve bertaraf edilmesine yönelik kullanılacaktır.</p>

<h2>Yaklaşımımız</h2>
<p>Kurumsal Risk Analizi; stratejilerle yönetilen, riskleri minimize eden bir yaklaşımla borsanın her alt birimine yönelik gerçekleştirilecektir. Risklerin getirebileceği fırsatlar belirlenecek, değerlendirilecek ve üyelerin hizmetine sunulacaktır.</p>
${SIGN}`.trim(),

  "haberlesme-politikasi": `
<table class="corp-meta">
  <thead><tr><th>Doküman Kodu</th><th>Yayın Tarihi</th><th>Revizyon</th><th>Revizyon Tarihi</th></tr></thead>
  <tbody><tr><td>PO 02</td><td>15.02.2018</td><td>01</td><td>15.10.2024</td></tr></tbody>
</table>

<h2>Haberleşme Politikası</h2>
<p>Erzurum Ticaret Borsası; misyon ve vizyonu doğrultusunda, iç ve dış paydaşlarımız ile kamuoyunun talep ve beklentilerini dikkate alarak, günümüz teknolojisinin sunduğu tüm imkânları değerlendirerek en etkin ve hızlı biçimde iletişim sağlayacağı araçları kullanarak kurumumuzun faaliyetlerini, hizmetlerini ve güncel gelişmelerini paydaşlarımızın ve kamuoyunun hizmetine sunmayı hedeflemektedir.</p>

<h2>Haberleşme Stratejisi</h2>
<ul class="corp-points">
  <li>Borsamız, başta üyeleri olmak üzere basın kuruluşları ve kamu kurumlarıyla haberleşmede Yönetim Kurulunun onayladığı hızlı ve etkili iletişim yöntemlerini tercih eder.</li>
  <li>Başta telefon olmak üzere yazılı, görsel ve dijital haberleşme araçlarını kullanarak ilgili taraflarla iletişim kurar ve bilgilendirir. Konunun önemine ve aciliyetine göre birden fazla yöntem birlikte kullanılır.</li>
  <li>Borsa Yönetim Kurulu, görüş ve önerileriyle haberleşme yöntemlerini değiştirir veya yöntemin aksayan yönlerinin düzeltilmesini sağlar.</li>
  <li>ETB'nin faaliyetlerinin kamuoyunda duyurulması ve basın kuruluşlarıyla teması Basın ve Özel Kalem Müdürlüğü tarafından sağlanır.</li>
  <li>Basın ve Özel Kalem Müdürlüğü, gerektiğinde ETB ile ilgili yazılı ve görsel materyalleri basın kuruluşlarıyla paylaşır.</li>
</ul>
${SIGN}`.trim(),

  "insan-kaynaklari-politikasi": `
<p>Erzurum Ticaret Borsası insan kaynakları politikası, kurumumuzun stratejik plan ve hedefleri doğrultusunda üyelerimize verdiğimiz hizmet kalitesini artırmak; personelin üstlendiği görevleri etkin ve verimli bir şekilde yerine getirebilmesini, mesleki ve etik kurallara bağlı nitelikli personelin istihdamını ve bu niteliklerin sürdürülebilirliğini sağlamaktır.</p>

<p>Erzurum Ticaret Borsası insan kaynağını stratejik bir kaynak olarak tanımlamakta ve en verimli biçimde yönetilmesi için aşağıdaki ilkeleri benimsemektedir:</p>

<ol class="corp-numbered">
  <li>Çalışanların başarısının ekip çalışması ile olacağından çalışma ortamının iyileştirilmesi yapılarak motivasyon ve bağlılık ön planda tutulur.</li>
  <li>Çalışanların bilgi ve becerilerini artırmak amacıyla mesleki ve kişisel anlamda sürekli gelişimlerini sağlamak için eğitim ihtiyacı belirlenir ve eğitimlere önem verilir.</li>
  <li>Personelin hak ve sorumlulukları göz ardı edilmeden, çalışma hayatı ile ilgili yasa ve kurallara uygun hareket edilir.</li>
  <li>Çalışanlar arasında fırsat eşitliği sağlanır.</li>
  <li>Çalışanların iletişiminin artırılması için sosyal ve kültürel faaliyetler düzenlenir.</li>
</ol>
${SIGN}`.trim(),

  "mali-politika": `
<p>Erzurum Ticaret Borsası mali politikasının temel amacı, 5174 Sayılı Kanun çerçevesinde çıkartılan Türkiye Odalar ve Borsalar Birliği ile Odalar ve Borsalar Bütçe ve Muhasebe Yönetmeliğinde belirtilen hükmü yerine getirmektir:</p>

<blockquote>Gelir ve gider bütçelerinin hazırlanması, kesin hesabın çıkarılması, hesap ve kayıt düzeninde şeffaflık ve tekdüzenin sağlanması, bütün işlemlerin kayıt altına alınması, faaliyetlerin gerçek mahiyetlerine uygun olarak sağlıklı ve güvenilir bir biçimde muhasebeleştirilmesi, mali tabloların uluslararası standartlara uygun, zamanında ve doğru hazırlanması ve raporlanması.</blockquote>

<h2>Temel İlke ve Esaslar</h2>
<p>Erzurum Ticaret Borsası muhasebe işlemleri aşağıdaki temel ilke ve esaslara göre yönetilir:</p>
<ol class="corp-numbered">
  <li>Şeffaflık</li>
  <li>Sosyal sorumluluk</li>
  <li>Tekdüzenin sağlanması</li>
  <li>Hesap verilebilirlik</li>
  <li>Tarafsızlık ve belgelendirme</li>
  <li>Önemlilik ve tutarlılık</li>
  <li>Özün önceliği ve ihtiyatlılık</li>
  <li>5174 Sayılı Kanun ve yönetmeliklere uygunluk</li>
  <li>Uluslararası mali standartlara uygunluk</li>
</ol>
${SIGN}`.trim(),

  "uye-iliskileri-politikasi": `
<p>Üye taleplerine karşı duyarlı, katılımcılığa önem veren, şeffaf ve hesap veren bir politika ile hizmetlerini gerçekleştiren Erzurum Ticaret Borsası; üye taleplerini, şikâyet ve memnuniyetlerini sorunsuz ve hızlı bir şekilde iletebildiği, bu bildirimlerin dikkatli ve titizlikle değerlendirildiği ve gerekli iyileştirmelerin sürekli yapıldığı müşteri odaklı yaklaşımı takip etmektedir.</p>

<h2>Politika Kapsamı</h2>
<ul class="corp-points">
  <li>Üyelerin taleplerinin ve başvurularının en kısa sürede cevaplandırılması; talep ettikleri bilgiye en hızlı şekilde ulaşabilmelerinin sağlanması.</li>
  <li>Üye başvuruları esnasında elde edilen kişisel bilgilerin kullanımının yasalarla sınırlı olması ve gizlilik prensibine bağlı kalınması.</li>
  <li>Üyelerden gelen öneri ve düşüncelerin titizlikle değerlendirilmesi.</li>
  <li>Üyelerin ilettikleri başvuruların değerlendirme ve çözüm aşamalarıyla ilgili en etkin şekilde bilgilendirilmesi.</li>
  <li>ETB tarafından sunulan çeşitli iletişim kanallarıyla müşterilerimizin şikâyet, bilgi talebi, öneri veya memnuniyetlerini kolayca iletebilmesi.</li>
</ul>
${SIGN}`.trim(),

  "uye-memnuniyet-politikasi": `
<p>Borsamız; paydaşlarının öneri, talep ve şikâyetlerinin çözümlenmesini bir öncelik olarak belirlemiştir.</p>

<h2>Taahhütlerimiz</h2>
<ul class="corp-points">
  <li>Paydaş öneri, talep ve şikâyetlerini açık, şeffaf, hızlı, güven verici ve paydaş odaklı bir şekilde çözmeyi taahhüt ederiz.</li>
  <li>Paydaş öneri, talep ve şikâyetlerini daima kaliteli hizmet sunma anlayışımızla ele alırız.</li>
  <li>Paydaşlarımızdan şikâyet aldığımız durumda her şikâyeti objektif, özenli ve dikkatli bir şekilde inceler; çözüm sunarız. Şikâyet ve öneriler paralelinde kalıcı iyileştirmeleri sistem ve süreçlerimizde uygularız.</li>
  <li>Çalışanların katılımcılığını, paylaşımcılığını ve yaratıcılığını destekleyerek kendilerini ifade edebilecekleri ve sürekli gelişebilecekleri ortamlar sağlarız.</li>
  <li>Şikâyet Yönetimi Süreci yasa ve mevzuata, paydaş beklentilerine uyar; çalışan bildirimlerini dikkate alarak ilerler.</li>
  <li>Şikâyet Yönetimi Süreci ve kullanılan sistemler; gelişime açık alanların tespiti ve verimliliğin artırılması için düzenli olarak gözden geçirilir, etkinlikler raporlanır ve sürekli iyileştirilir.</li>
</ul>
${SIGN}`.trim(),
};
