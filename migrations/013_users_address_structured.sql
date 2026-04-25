-- Replace single `address` with separate fields; migrate old text into line1
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS address_line1 TEXT,
  ADD COLUMN IF NOT EXISTS address_line2 TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS state TEXT,
  ADD COLUMN IF NOT EXISTS postal_code TEXT,
  ADD COLUMN IF NOT EXISTS country TEXT;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'users'
      AND column_name = 'address'
  ) THEN
    UPDATE users
    SET address_line1 = address
    WHERE address IS NOT NULL
      AND btrim(address) <> ''
      AND (address_line1 IS NULL OR btrim(COALESCE(address_line1, '')) = '');

    ALTER TABLE users DROP COLUMN address;
  END IF;
END $$;
