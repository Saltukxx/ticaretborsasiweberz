-- Erzurum: 20 ilçe harita verisi (legacy merkez pasif)
INSERT INTO map_districts (slug, label, product_line, daily_volume, member_count, registration_count, sort_order, is_active, updated_at)
VALUES
  ('askale', 'Aşkale', 'Hububat · Yemlik', '—', 0, 0, 0, true, NOW()),
  ('aziziye', 'Aziziye', 'Hububat · Hayvancılık', '—', 0, 0, 1, true, NOW()),
  ('cat', 'Çat', 'Yemlik · Arpa', '—', 0, 0, 2, true, NOW()),
  ('hinis', 'Hınıs', 'Hububat · Bakliyat', '—', 0, 0, 3, true, NOW()),
  ('horasan', 'Horasan', 'Hububat · Bakliyat', '—', 0, 0, 4, true, NOW()),
  ('ispir', 'İspir', 'Süt · Tarımsal üretim', '—', 0, 0, 5, true, NOW()),
  ('karacoban', 'Karaçoban', 'Hububat · Hayvancılık', '—', 0, 0, 6, true, NOW()),
  ('karayazi', 'Karayazı', 'Hububat · Mera hayvancılığı', '—', 0, 0, 7, true, NOW()),
  ('koprukoy', 'Köprüköy', 'Hububat · Tarımsal ticaret', '—', 0, 0, 8, true, NOW()),
  ('narman', 'Narman', 'Hububat', '—', 0, 0, 9, true, NOW()),
  ('oltu', 'Oltu', 'Tarımsal karışık · Orman ürünleri', '—', 0, 0, 10, true, NOW()),
  ('olur', 'Olur', 'Hayvancılık · Hububat', '—', 0, 0, 11, true, NOW()),
  ('palandoken', 'Palandöken', 'Hububat · Ticaret', '—', 0, 0, 12, true, NOW()),
  ('pasinler', 'Pasinler', 'Buğday · Arpa', '—', 0, 0, 13, true, NOW()),
  ('pazaryolu', 'Pazaryolu', 'Hayvancılık · Orman ürünleri', '—', 0, 0, 14, true, NOW()),
  ('senkaya', 'Şenkaya', 'Hububat · Hayvancılık', '—', 0, 0, 15, true, NOW()),
  ('tekman', 'Tekman', 'Hububat · Yemlik', '—', 0, 0, 16, true, NOW()),
  ('tortum', 'Tortum', 'Hayvancılık · Meyve', '—', 0, 0, 17, true, NOW()),
  ('uzundere', 'Uzundere', 'Tarımsal üretim · Hayvancılık', '—', 0, 0, 18, true, NOW()),
  ('yakutiye', 'Yakutiye', 'Hububat · Tescil Merkezi', '—', 0, 0, 19, true, NOW())
ON CONFLICT (slug) DO UPDATE SET
  label = EXCLUDED.label,
  product_line = EXCLUDED.product_line,
  daily_volume = EXCLUDED.daily_volume,
  member_count = EXCLUDED.member_count,
  registration_count = EXCLUDED.registration_count,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

UPDATE map_districts SET is_active = false, updated_at = NOW() WHERE slug = 'merkez';
