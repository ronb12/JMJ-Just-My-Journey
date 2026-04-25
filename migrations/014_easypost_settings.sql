-- Optional EasyPost API key and ship-from address in DB (encrypted key; from-address editable in admin)
CREATE TABLE IF NOT EXISTS easypost_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  use_custom_easypost BOOLEAN NOT NULL DEFAULT false,
  encrypted_api_key TEXT,
  from_name TEXT,
  from_street1 TEXT,
  from_street2 TEXT,
  from_city TEXT,
  from_state TEXT,
  from_zip TEXT,
  from_country TEXT,
  from_phone TEXT,
  from_email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO easypost_settings (id, use_custom_easypost)
SELECT gen_random_uuid(), false
WHERE NOT EXISTS (SELECT 1 FROM easypost_settings);
