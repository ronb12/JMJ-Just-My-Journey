-- Optional mailing / service address for customer accounts
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS address TEXT;
