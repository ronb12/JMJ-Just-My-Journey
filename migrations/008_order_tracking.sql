-- Public tracking (manual) + timeline for customers and admins
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS tracking_carrier TEXT,
  ADD COLUMN IF NOT EXISTS tracking_number TEXT,
  ADD COLUMN IF NOT EXISTS tracking_url TEXT;

CREATE TABLE IF NOT EXISTS order_tracking_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  fulfillment_status TEXT,
  message TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'system' CHECK (source IN ('fulfillment', 'tracking', 'label', 'admin_note', 'system')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_order_tracking_events_order
  ON order_tracking_events (order_id, created_at DESC);
