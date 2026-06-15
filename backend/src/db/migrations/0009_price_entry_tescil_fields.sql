-- Tescil bülteni: işlem tutarı ve işlem adedi
ALTER TABLE price_entries
  ADD COLUMN IF NOT EXISTS transaction_amount numeric(16, 4),
  ADD COLUMN IF NOT EXISTS transaction_count integer;
