-- Kurumsal belgeler: politikalar, tarihçe, iş planı, organizasyon şeması (PDF)

CREATE TABLE IF NOT EXISTS corporate_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug varchar(120) NOT NULL UNIQUE,
  title varchar(300) NOT NULL,
  summary text,
  category varchar(40) NOT NULL DEFAULT 'politika',
  file_id uuid NOT NULL REFERENCES media(id),
  sort_order smallint NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT true,
  created_by uuid NOT NULL REFERENCES admins(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_corporate_documents_category
  ON corporate_documents (category, sort_order);

CREATE INDEX IF NOT EXISTS idx_corporate_documents_published
  ON corporate_documents (is_published, sort_order);
