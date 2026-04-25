-- Add site-wide settings (social links, etc.)
CREATE TABLE IF NOT EXISTS site_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facebook_url TEXT,
  instagram_url TEXT,
  tiktok_url TEXT,
  youtube_url TEXT,
  x_url TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ensure exactly one row exists for simple singleton reads.
INSERT INTO site_settings (id)
SELECT gen_random_uuid()
WHERE NOT EXISTS (SELECT 1 FROM site_settings);

