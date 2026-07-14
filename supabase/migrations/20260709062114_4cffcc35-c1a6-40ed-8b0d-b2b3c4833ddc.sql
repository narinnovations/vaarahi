ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS tracking_url text,
  ADD COLUMN IF NOT EXISTS dispatch_date date,
  ADD COLUMN IF NOT EXISTS estimated_delivery_date date,
  ADD COLUMN IF NOT EXISTS shipping_notes text;