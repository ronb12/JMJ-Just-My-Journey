-- Admin-composed newsletter content (outbound email not wired; drafts for copy/paste or future send)
CREATE TABLE newsletter_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  subject_line TEXT NOT NULL,
  body TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'archived')),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  sent_at TIMESTAMPTZ
);

CREATE INDEX idx_newsletter_posts_updated ON newsletter_posts (updated_at DESC);
CREATE INDEX idx_newsletter_posts_status ON newsletter_posts (status, updated_at DESC);
