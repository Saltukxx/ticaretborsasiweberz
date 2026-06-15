-- Trust & compliance: contact inbox, newsletter, legal pages, site contact fields

CREATE TABLE IF NOT EXISTS contact_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name varchar(200) NOT NULL,
  organization varchar(300),
  email varchar(320) NOT NULL,
  phone varchar(50),
  subject varchar(500) NOT NULL,
  message text NOT NULL,
  status varchar(20) NOT NULL DEFAULT 'new',
  ip_address varchar(45),
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contact_submissions_status_created
  ON contact_submissions (status, created_at DESC);

CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email varchar(320) NOT NULL UNIQUE,
  frequency varchar(20) NOT NULL DEFAULT 'weekly',
  status varchar(20) NOT NULL DEFAULT 'active',
  ip_address varchar(45),
  created_at timestamptz NOT NULL DEFAULT now(),
  unsubscribed_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_status
  ON newsletter_subscribers (status, created_at DESC);

CREATE TABLE IF NOT EXISTS legal_pages (
  slug varchar(64) PRIMARY KEY,
  title varchar(300) NOT NULL,
  body text NOT NULL DEFAULT '',
  is_published boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE corporate_profile
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS phone varchar(100),
  ADD COLUMN IF NOT EXISTS fax varchar(100),
  ADD COLUMN IF NOT EXISTS email_primary varchar(320),
  ADD COLUMN IF NOT EXISTS email_secondary varchar(320),
  ADD COLUMN IF NOT EXISTS hours text,
  ADD COLUMN IF NOT EXISTS social_linkedin varchar(500),
  ADD COLUMN IF NOT EXISTS social_x varchar(500),
  ADD COLUMN IF NOT EXISTS social_youtube varchar(500),
  ADD COLUMN IF NOT EXISTS social_instagram varchar(500);
