-- Allow admins to specify what is included in a package.
ALTER TABLE packages
  ADD COLUMN IF NOT EXISTS includes TEXT;

