-- Add more site-wide settings for Admin → Settings.
ALTER TABLE site_settings
  ADD COLUMN IF NOT EXISTS business_name TEXT,
  ADD COLUMN IF NOT EXISTS support_email TEXT,
  ADD COLUMN IF NOT EXISTS support_phone TEXT,
  ADD COLUMN IF NOT EXISTS support_address TEXT,
  ADD COLUMN IF NOT EXISTS footer_note TEXT;

