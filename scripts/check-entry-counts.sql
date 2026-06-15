SELECT cp.slug,
       COUNT(*) AS total,
       COUNT(*) FILTER (WHERE pe.entry_date >= CURRENT_DATE - 6)  AS last7d,
       COUNT(*) FILTER (WHERE pe.entry_date >= CURRENT_DATE - 29) AS last30d,
       COUNT(*) FILTER (WHERE pe.entry_date >= CURRENT_DATE - 364) AS last365d,
       MIN(pe.entry_date) AS first,
       MAX(pe.entry_date) AS last
FROM price_entries pe
JOIN commodity_products cp ON cp.id = pe.product_id
WHERE cp.slug ILIKE '%biber%'
   OR cp.slug ILIKE '%bugday%'
   OR cp.slug ILIKE '%civil%'
GROUP BY cp.slug
ORDER BY cp.slug
LIMIT 25;
