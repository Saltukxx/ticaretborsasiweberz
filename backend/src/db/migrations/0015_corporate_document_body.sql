-- Kurumsal belgeler: HTML içerik alanı (PDF yerine sayfa içeriği)

ALTER TABLE corporate_documents
  ADD COLUMN IF NOT EXISTS body text;
