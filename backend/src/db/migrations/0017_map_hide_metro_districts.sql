-- Hide metropolitan districts on map (represented by merkez)
UPDATE map_districts SET is_active = false, updated_at = NOW()
WHERE slug IN ('yakutiye', 'aziziye', 'palandoken');
