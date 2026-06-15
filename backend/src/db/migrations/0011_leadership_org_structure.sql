-- Kurumsal organizasyon yapısı: leadership tablosuna grup alanı + kadro kayıtları
-- Gruplar: yonetim_kurulu, meclis, tobb_delegeleri, personel, danisman
-- İdempotent: tekrar çalıştırılabilir.

ALTER TABLE "leadership" ADD COLUMN IF NOT EXISTS "group_key" varchar(50) NOT NULL DEFAULT 'yonetim_kurulu';

CREATE INDEX IF NOT EXISTS "idx_leadership_group_key" ON "leadership" ("group_key");

-- Mevcut başkan kaydı yönetim kurulu grubunda kalır (varsayılan değer).

-- ── Yönetim Kurulu ───────────────────────────────────────────────────────────
INSERT INTO "leadership" ("role_key", "group_key", "name", "title", "sort_order") VALUES
  ('baskan',            'yonetim_kurulu', 'Yıldırım Hakan ORAL', 'Yönetim Kurulu Başkanı', 0),
  ('yk_turhan_dinler',  'yonetim_kurulu', 'Turhan DİNLER',       'Yönetim Kurulu Başkan Yardımcısı', 10),
  ('yk_eletdin_urusan', 'yonetim_kurulu', 'Eletdin ÜRÜŞAN',      'Yönetim Kurulu Başkan Yardımcısı', 20),
  ('yk_ali_lac',        'yonetim_kurulu', 'Ali LAÇ',             'Yönetim Kurulu Üyesi', 30),
  ('yk_aykut_koc',      'yonetim_kurulu', 'Aykut KOÇ',           'Yönetim Kurulu Üyesi', 40),
  ('yk_yalcin_meral',   'yonetim_kurulu', 'Yalçın MERAL',        'Yönetim Kurulu Üyesi', 50),
  ('yk_vesfi_koc',      'yonetim_kurulu', 'Vesfi KOÇ',           'Yönetim Kurulu Üyesi', 60),
  ('yk_orhan_tohumcu',  'yonetim_kurulu', 'Orhan TOHUMCU',       'Yönetim Kurulu Üyesi', 70),
  ('yk_yavuz_akpinar',  'yonetim_kurulu', 'Yavuz AKPINAR',       'Yönetim Kurulu Üyesi', 80)
ON CONFLICT ("role_key") DO NOTHING;

-- ── Meclis ───────────────────────────────────────────────────────────────────
INSERT INTO "leadership" ("role_key", "group_key", "name", "title", "sort_order") VALUES
  ('meclis_yavuz_guney',         'meclis', 'Yavuz GÜNEY',          'Meclis Başkanı', 0),
  ('meclis_yavuz_sari',          'meclis', 'Yavuz SARI',           'Meclis Başkan Yardımcısı', 10),
  ('meclis_huseyin_yigit',       'meclis', 'Hüseyin YİĞİT',        'Meclis Başkan Yardımcısı', 20),
  ('meclis_selami_atis',         'meclis', 'Selami ATİŞ',          'Katip Üye', 30),
  ('meclis_yildirim_hakan_oral', 'meclis', 'Yıldırım Hakan ORAL',  'Meclis Üyesi', 40),
  ('meclis_aykut_koc',           'meclis', 'Aykut KOÇ',            'Meclis Üyesi', 50),
  ('meclis_eletdin_urusan',      'meclis', 'Eletdin ÜRÜŞAN',       'Meclis Üyesi', 60),
  ('meclis_halis_ceylan',        'meclis', 'Halis CEYLAN',         'Meclis Üyesi', 70),
  ('meclis_ibrahim_turan',       'meclis', 'İbrahim TURAN',        'Meclis Üyesi', 80),
  ('meclis_kemal_aras',          'meclis', 'Kemal ARAS',           'Meclis Üyesi', 90),
  ('meclis_mehmet_ozdemir',      'meclis', 'Mehmet ÖZDEMİR',       'Meclis Üyesi', 100),
  ('meclis_orhan_tohumcu',       'meclis', 'Orhan TOHUMCU',        'Meclis Üyesi', 110),
  ('meclis_zeki_unal',           'meclis', 'Zeki ÜNAL',            'Meclis Üyesi', 120),
  ('meclis_yalcin_meral',        'meclis', 'Yalçın MERAL',         'Meclis Üyesi', 130),
  ('meclis_vesfi_koc',           'meclis', 'Vesfi KOÇ',            'Meclis Üyesi', 140),
  ('meclis_vedat_altunkaynak',   'meclis', 'Vedat ALTUNKAYNAK',    'Meclis Üyesi', 150),
  ('meclis_nevzat_gul',          'meclis', 'Nevzat GÜL',           'Meclis Üyesi', 160),
  ('meclis_serafettin_uzun',     'meclis', 'Şerafettin UZUN',      'Meclis Üyesi', 170),
  ('meclis_yavuz_akpinar',       'meclis', 'Yavuz AKPINAR',        'Meclis Üyesi', 180),
  ('meclis_turhan_dinler',       'meclis', 'Turhan DİNLER',        'Meclis Üyesi', 190),
  ('meclis_muharrem_avci',       'meclis', 'Muharrem AVCI',        'Meclis Üyesi', 200),
  ('meclis_kenan_keskin',        'meclis', 'Kenan KESKİN',         'Meclis Üyesi', 210),
  ('meclis_ali_lac',             'meclis', 'Ali LAÇ',              'Meclis Üyesi', 220),
  ('meclis_umit_ceper',          'meclis', 'Ümit ÇEPER',           'Meclis Üyesi', 230),
  ('meclis_salih_cizmali',       'meclis', 'Salih CIZMALI',        'Meclis Üyesi', 240),
  ('meclis_ferit_yildiz',        'meclis', 'Ferit YILDIZ',         'Meclis Üyesi', 250),
  ('meclis_suat_zengin',         'meclis', 'Suat ZENGİN',          'Meclis Üyesi', 260),
  ('meclis_erkan_ulgu',          'meclis', 'Erkan ÜLGÜ',           'Meclis Üyesi', 270),
  ('meclis_ugur_tunc',           'meclis', 'Uğur TUNÇ',            'Meclis Üyesi', 280),
  ('meclis_cemal_aras',          'meclis', 'Cemal ARAS',           'Meclis Üyesi', 290),
  ('meclis_abdulkadir_tubay',    'meclis', 'Abdulkadir TUBAY',     'Meclis Üyesi', 300),
  ('meclis_nurettin_kayli',      'meclis', 'Nurettin KAYLI',       'Meclis Üyesi', 310),
  ('meclis_ismail_celik',        'meclis', 'İsmail ÇELİK',         'Meclis Üyesi', 320),
  ('meclis_ismail_yesilyurt',    'meclis', 'İsmail YEŞİLYURT',     'Meclis Üyesi', 330),
  ('meclis_musa_kagni',          'meclis', 'Musa KAĞNI',           'Meclis Üyesi', 340),
  ('meclis_ishak_sakiroglu',     'meclis', 'İshak ŞAKİROĞLU',      'Meclis Üyesi', 350),
  ('meclis_necmettin_uzun',      'meclis', 'Necmettin UZUN',       'Meclis Üyesi', 360)
ON CONFLICT ("role_key") DO NOTHING;

-- ── TOBB Genel Kurul Delegeleri ──────────────────────────────────────────────
INSERT INTO "leadership" ("role_key", "group_key", "name", "title", "sort_order") VALUES
  ('tobb_yildirim_hakan_oral', 'tobb_delegeleri', 'Yıldırım Hakan ORAL', 'Yönetim Kurulu Başkanı', 0),
  ('tobb_yavuz_sari',          'tobb_delegeleri', 'Yavuz SARI',          'Meclis Başkan Yardımcısı', 10),
  ('tobb_suat_zengin',         'tobb_delegeleri', 'Suat ZENGİN',         'Meclis Üyesi', 20)
ON CONFLICT ("role_key") DO NOTHING;

-- ── Danışman ────────────────────────────────────────────────────────────────
INSERT INTO "leadership" ("role_key", "group_key", "name", "title", "eyebrow", "quote_lines", "sort_order") VALUES
  (
    'danisman_ensar_agirman',
    'danisman',
    'Prof. Dr. Ensar AĞIRMAN',
    'Stratejik Dönüşüm ve Uluslararası Projeler Danışmanı',
    'Erzurum Ticaret Borsası',
    ARRAY[
      'Prof. Dr. Ensar Ağırman, finans, uluslararası projeler ve stratejik dönüşüm alanlarında uzmanlaşmış bir akademisyen ve danışmandır. Atatürk Üniversitesi İktisadi ve İdari Bilimler Fakültesi İşletme Bölümü''nde profesör olarak görev yapmakta olup; finans, dijital ekonomi ve sürdürülebilir kalkınma alanlarında çok sayıda akademik çalışma ve projeye katkı sağlamıştır.',
      'Geniş uluslararası deneyime sahip olan Prof. Ağırman, lisansüstü eğitimini Amerika Birleşik Devletleri''nde tamamlamış; akademik ve mesleki çalışmalarını küresel bir perspektifle şekillendirmiştir. Avrupa Birliği projeleri, uluslararası finansman mekanizmaları ve kurumların küresel entegrasyon süreçleri konularında özel uzmanlığa sahiptir.'
    ],
    0
  )
ON CONFLICT ("role_key") DO NOTHING;

-- ── Genel Sekreterlik ve Personel ───────────────────────────────────────────
INSERT INTO "leadership" ("role_key", "group_key", "name", "title", "sort_order") VALUES
  ('personel_ensar_korucuk',          'personel', 'Ensar KORUCUK',            'Genel Sekreter', 0),
  ('personel_sevil_ilhan',            'personel', 'Av. Sevil İLHAN',          'Hukuk Müşaviri & Genel Sekreter Yardımcısı', 10),
  ('personel_ahmet_selcuk_bilirdonmez', 'personel', 'Ahmet Selçuk BİLİRDÖNMEZ', 'Basın ve Özel Kalem Müdürü', 20),
  ('personel_fuat_aydemir',           'personel', 'Fuat AYDEMİR',             'Tescil İşleri Müdürü', 30),
  ('personel_mucahit_veliogullari',   'personel', 'Mücahit VELİOĞULLARI',     'Muamelat ve Kararlar Müdürlüğü', 40),
  ('personel_kubra_ozlem_yanlic',     'personel', 'Kübra Özlem YANLIÇ',       'Akreditasyon, Proje Geliştirme, Laboratuvar', 50),
  ('personel_nurseda_yilmaz',         'personel', 'Nurseda YILMAZ',           'Akreditasyon, Proje Geliştirme, Laboratuvar ve Dış İlişkiler', 60),
  ('personel_kubra_akyuz',            'personel', 'Kübra AKYÜZ',              'Akreditasyon, Proje Geliştirme, Laboratuvar ve Dış İlişkiler', 70),
  ('personel_furkan_dursun_incesu',   'personel', 'Furkan Dursun İNCESU',     'Özel Kalem', 80),
  ('personel_veysel_alperen_altinbas','personel', 'Veysel Alperen ALTINBAŞ',  'Sosyal Medya Uzmanı ve İçerik Üreticisi', 90),
  ('personel_adnan_akgun',            'personel', 'Adnan AKGÜN',              'Muhasebe Memuru', 100),
  ('personel_sibel_yuksel',           'personel', 'Sibel YÜKSEL',             'Muhasebe Memuru', 110),
  ('personel_ayla_ulas_baltaci',      'personel', 'Ayla Ulaş BALTACI',        'Muhasebe Memuru', 120),
  ('personel_musa_basar',             'personel', 'Musa BAŞAR',               'Tescil Memuru ve Bilgi İşlem Sorumlusu', 130),
  ('personel_erdogan_laloglu',        'personel', 'Erdoğan LALOĞLU',          'Tescil Memuru', 140),
  ('personel_efendi_aycan',           'personel', 'Efendi AYCAN',             'Tescil Memuru', 150),
  ('personel_hasan_altun',            'personel', 'Hasan ALTUN',              'Veznedar', 160),
  ('personel_senol_diler',            'personel', 'Şenol DİLER',              'Şoför', 170),
  ('personel_vedat_sucu',             'personel', 'Vedat SUCU',               'Yardımcı Hizmetler Personeli', 180),
  ('personel_mukremin_burak',         'personel', 'Mükremin BURAK',           'Yardımcı Hizmetler Personeli', 190),
  ('personel_arzu_sengul',            'personel', 'Arzu ŞENGÜL',              'Yardımcı Hizmetler Personeli', 200),
  ('personel_ercan_osmanoglu',        'personel', 'Ercan OSMANOĞLU',          'Yardımcı Hizmetler Personeli', 210)
ON CONFLICT ("role_key") DO NOTHING;
