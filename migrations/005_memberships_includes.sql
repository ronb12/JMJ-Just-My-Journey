-- Allow admins to specify what is included in a membership.
ALTER TABLE memberships
  ADD COLUMN IF NOT EXISTS includes TEXT;

