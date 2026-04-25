ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS easypost_shipment_id TEXT,
  ADD COLUMN IF NOT EXISTS easypost_label_url TEXT,
  ADD COLUMN IF NOT EXISTS easypost_tracking_code TEXT,
  ADD COLUMN IF NOT EXISTS easypost_rate_id TEXT;

