-- Üye anlaşmaları (Hizmetler → Anlaşmalarımız)

CREATE TABLE IF NOT EXISTS service_agreements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug varchar(100) NOT NULL UNIQUE,
  title varchar(255) NOT NULL,
  summary text,
  body text NOT NULL,
  category varchar(50) NOT NULL DEFAULT 'other',
  sort_order smallint NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_service_agreements_published
  ON service_agreements (is_published, sort_order);
