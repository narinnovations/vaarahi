
-- Extend app_role enum
DO $$ BEGIN
  ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'manager';
EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN
  ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'staff';
EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN
  ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'readonly';
EXCEPTION WHEN others THEN NULL; END $$;

-- Extend profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS blocked boolean NOT NULL DEFAULT false;

-- Extend user_roles with permissions jsonb
ALTER TABLE public.user_roles ADD COLUMN IF NOT EXISTS permissions jsonb NOT NULL DEFAULT '{}'::jsonb;

-- =========== SUPPLIERS ===========
CREATE TABLE IF NOT EXISTS public.suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text,
  email text,
  address text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.suppliers TO authenticated;
GRANT ALL ON public.suppliers TO service_role;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage suppliers" ON public.suppliers FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE TRIGGER tg_suppliers_touch BEFORE UPDATE ON public.suppliers FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();

-- =========== STOCK MOVEMENTS ===========
CREATE TABLE IF NOT EXISTS public.stock_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  delta integer NOT NULL,
  reason text NOT NULL DEFAULT 'adjustment',
  reference_id uuid,
  note text,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_stock_movements_product ON public.stock_movements(product_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.stock_movements TO authenticated;
GRANT ALL ON public.stock_movements TO service_role;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage stock movements" ON public.stock_movements FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- Trigger: apply stock movement delta to products.stock
CREATE OR REPLACE FUNCTION public.tg_apply_stock_movement()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  UPDATE public.products SET stock = GREATEST(0, stock + NEW.delta) WHERE id = NEW.product_id;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS tg_stock_movements_apply ON public.stock_movements;
CREATE TRIGGER tg_stock_movements_apply AFTER INSERT ON public.stock_movements
FOR EACH ROW EXECUTE FUNCTION public.tg_apply_stock_movement();

-- =========== PURCHASE ENTRIES ===========
CREATE TABLE IF NOT EXISTS public.purchase_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id uuid REFERENCES public.suppliers(id) ON DELETE SET NULL,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity integer NOT NULL CHECK (quantity > 0),
  unit_cost numeric(10,2) NOT NULL DEFAULT 0,
  purchase_date date NOT NULL DEFAULT CURRENT_DATE,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.purchase_entries TO authenticated;
GRANT ALL ON public.purchase_entries TO service_role;
ALTER TABLE public.purchase_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage purchases" ON public.purchase_entries FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- Auto-add stock movement on purchase entry
CREATE OR REPLACE FUNCTION public.tg_purchase_to_movement()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  INSERT INTO public.stock_movements(product_id, delta, reason, reference_id, note, user_id)
  VALUES (NEW.product_id, NEW.quantity, 'purchase', NEW.id, COALESCE(NEW.notes, 'Purchase entry'), auth.uid());
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS tg_purchase_entries_move ON public.purchase_entries;
CREATE TRIGGER tg_purchase_entries_move AFTER INSERT ON public.purchase_entries
FOR EACH ROW EXECUTE FUNCTION public.tg_purchase_to_movement();

-- =========== PRODUCT STOCK META ===========
CREATE TABLE IF NOT EXISTS public.product_stock_meta (
  product_id uuid PRIMARY KEY REFERENCES public.products(id) ON DELETE CASCADE,
  reserved integer NOT NULL DEFAULT 0,
  low_stock_threshold integer NOT NULL DEFAULT 5,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_stock_meta TO authenticated;
GRANT ALL ON public.product_stock_meta TO service_role;
ALTER TABLE public.product_stock_meta ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage stock meta" ON public.product_stock_meta FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Anyone can read stock meta" ON public.product_stock_meta FOR SELECT USING (true);
CREATE TRIGGER tg_stock_meta_touch BEFORE UPDATE ON public.product_stock_meta FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();

-- =========== WISHLISTS ===========
CREATE TABLE IF NOT EXISTS public.wishlists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, product_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.wishlists TO authenticated;
GRANT ALL ON public.wishlists TO service_role;
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own wishlist" ON public.wishlists FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins view all wishlists" ON public.wishlists FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

-- =========== REVIEWS ===========
CREATE TABLE IF NOT EXISTS public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title text,
  body text,
  approved boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_reviews_product ON public.reviews(product_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reviews TO authenticated;
GRANT SELECT ON public.reviews TO anon;
GRANT ALL ON public.reviews TO service_role;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads approved reviews" ON public.reviews FOR SELECT USING (approved OR public.is_admin(auth.uid()) OR auth.uid() = user_id);
CREATE POLICY "Users write own reviews" ON public.reviews FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins moderate reviews" ON public.reviews FOR UPDATE TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Admins delete reviews" ON public.reviews FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));
CREATE TRIGGER tg_reviews_touch BEFORE UPDATE ON public.reviews FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();

-- =========== CUSTOMER NOTES ===========
CREATE TABLE IF NOT EXISTS public.customer_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  note text NOT NULL,
  author_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customer_notes TO authenticated;
GRANT ALL ON public.customer_notes TO service_role;
ALTER TABLE public.customer_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage customer notes" ON public.customer_notes FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- =========== CUSTOMER ADDRESSES ===========
CREATE TABLE IF NOT EXISTS public.customer_addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label text,
  full_name text,
  phone text,
  address_line1 text NOT NULL,
  address_line2 text,
  city text NOT NULL,
  state text NOT NULL,
  pincode text NOT NULL,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customer_addresses TO authenticated;
GRANT ALL ON public.customer_addresses TO service_role;
ALTER TABLE public.customer_addresses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own addresses" ON public.customer_addresses FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins view all addresses" ON public.customer_addresses FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE TRIGGER tg_addr_touch BEFORE UPDATE ON public.customer_addresses FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();

-- =========== NOTIFICATION SETTINGS ===========
CREATE TABLE IF NOT EXISTS public.notification_settings (
  key text PRIMARY KEY,
  enabled boolean NOT NULL DEFAULT true,
  channel text NOT NULL DEFAULT 'email',
  subject text,
  template text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notification_settings TO authenticated;
GRANT ALL ON public.notification_settings TO service_role;
ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage notification settings" ON public.notification_settings FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE TRIGGER tg_notif_settings_touch BEFORE UPDATE ON public.notification_settings FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();

-- =========== NOTIFICATION LOG ===========
CREATE TABLE IF NOT EXISTS public.notification_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel text NOT NULL,
  subject text,
  body text,
  target text,
  status text NOT NULL DEFAULT 'queued',
  error text,
  sent_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notification_log TO authenticated;
GRANT ALL ON public.notification_log TO service_role;
ALTER TABLE public.notification_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins view notification log" ON public.notification_log FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- =========== SEO ENTRIES ===========
CREATE TABLE IF NOT EXISTS public.seo_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scope text NOT NULL,
  ref_id text NOT NULL DEFAULT '',
  meta_title text,
  meta_description text,
  keywords text,
  canonical_url text,
  og_image text,
  twitter_card text DEFAULT 'summary_large_image',
  robots text DEFAULT 'index, follow',
  schema_json jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(scope, ref_id)
);
GRANT SELECT ON public.seo_entries TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.seo_entries TO authenticated;
GRANT ALL ON public.seo_entries TO service_role;
ALTER TABLE public.seo_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads seo entries" ON public.seo_entries FOR SELECT USING (true);
CREATE POLICY "Admins manage seo entries" ON public.seo_entries FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE TRIGGER tg_seo_touch BEFORE UPDATE ON public.seo_entries FOR EACH ROW EXECUTE FUNCTION public.tg_touch_updated_at();

-- =========== ACTIVITY LOGS ===========
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email text,
  action text NOT NULL,
  entity text,
  entity_id text,
  ip text,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_activity_created ON public.activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_user ON public.activity_logs(user_id);
GRANT SELECT, INSERT ON public.activity_logs TO authenticated;
GRANT ALL ON public.activity_logs TO service_role;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users insert own activity" ON public.activity_logs FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Admins view all activity" ON public.activity_logs FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

-- =========== PAGE VIEWS (Analytics) ===========
CREATE TABLE IF NOT EXISTS public.page_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  path text NOT NULL,
  referrer text,
  user_agent text,
  session_id text,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_pageviews_created ON public.page_views(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pageviews_path ON public.page_views(path);
GRANT INSERT ON public.page_views TO anon, authenticated;
GRANT SELECT ON public.page_views TO authenticated;
GRANT ALL ON public.page_views TO service_role;
ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone inserts page views" ON public.page_views FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins view page views" ON public.page_views FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

-- =========== CUSTOMER STATS FUNCTION ===========
CREATE OR REPLACE FUNCTION public.customer_stats(_user_id uuid)
RETURNS TABLE(total_orders bigint, total_spent numeric, last_order_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COUNT(*)::bigint, COALESCE(SUM(total), 0)::numeric, MAX(created_at)
  FROM public.orders WHERE user_id = _user_id AND status <> 'cancelled';
$$;

-- Auto-decrement stock on order item insert
CREATE OR REPLACE FUNCTION public.tg_order_item_stock()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.product_id IS NOT NULL THEN
    INSERT INTO public.stock_movements(product_id, delta, reason, reference_id, note)
    VALUES (NEW.product_id, -NEW.quantity, 'sale', NEW.order_id, 'Order ' || NEW.order_id::text);
  END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS tg_order_items_stock ON public.order_items;
CREATE TRIGGER tg_order_items_stock AFTER INSERT ON public.order_items
FOR EACH ROW EXECUTE FUNCTION public.tg_order_item_stock();
