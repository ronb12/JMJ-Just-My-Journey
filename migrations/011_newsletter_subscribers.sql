-- Public newsletter signups (email only; no outbound provider wired yet)
CREATE TABLE newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Stored normalized: lower(trim) from the API
  email TEXT NOT NULL UNIQUE,
  source TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_newsletter_subscribers_created
  ON newsletter_subscribers (created_at DESC);
