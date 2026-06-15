-- Reactivate ETB merkez tescil noktası on regional map
INSERT INTO map_districts (slug, label, product_line, daily_volume, member_count, registration_count, sort_order, is_active, updated_at)
VALUES
  ('merkez', 'Erzurum Merkez', 'Hububat · Tescil Merkezi', '—', 0, 0, -1, true, NOW())
ON CONFLICT (slug) DO UPDATE SET
  label = EXCLUDED.label,
  product_line = EXCLUDED.product_line,
  is_active = true,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();
