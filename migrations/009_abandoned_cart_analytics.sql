-- Internal analytics + abandoned-cart reminder audit
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  properties JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_analytics_name_created
  ON analytics_events (name, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_analytics_user_created
  ON analytics_events (user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS cart_reminder_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id UUID NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  items_count INTEGER NOT NULL DEFAULT 0,
  cart_value NUMERIC(12,2)
);

CREATE INDEX IF NOT EXISTS idx_cart_reminder_cart_sent
  ON cart_reminder_logs (cart_id, sent_at DESC);
