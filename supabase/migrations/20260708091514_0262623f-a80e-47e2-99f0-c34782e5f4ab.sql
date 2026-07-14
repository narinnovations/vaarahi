
-- ============ HERO BANNERS (CMS) ============
CREATE TABLE IF NOT EXISTS public.banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL DEFAULT '',
  subtitle TEXT NOT NULL DEFAULT '',
  eyebrow TEXT NOT NULL DEFAULT '',
  image_url TEXT NOT NULL,
  cta_label TEXT NOT NULL DEFAULT 'Shop Now',
  cta_link TEXT NOT NULL DEFAULT '/products',
  sort_order INT NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.banners TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.banners TO authenticated;
GRANT ALL ON public.banners TO service_role;
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public view banners" ON public.banners FOR SELECT USING (true);
CREATE POLICY "Admins manage banners" ON public.banners FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- ============ INSTAGRAM REELS ============
CREATE TABLE IF NOT EXISTS public.instagram_reels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reel_url TEXT NOT NULL,
  thumbnail_url TEXT,
  caption TEXT NOT NULL DEFAULT '',
  sort_order INT NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.instagram_reels TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.instagram_reels TO authenticated;
GRANT ALL ON public.instagram_reels TO service_role;
ALTER TABLE public.instagram_reels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public view reels" ON public.instagram_reels FOR SELECT USING (true);
CREATE POLICY "Admins manage reels" ON public.instagram_reels FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- ============ ORDER STATUS/TRACKING EXPANSION ============
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS tracking_number TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS courier_name TEXT;

-- ============ SITE SETTINGS — seed VAARAHI defaults ============
INSERT INTO public.site_settings (key, value) VALUES
  ('store', jsonb_build_object(
    'name', 'VAARAHI',
    'tagline', 'Jewellery · Fashion · Accessories',
    'address', 'Masjid Centre, Mantripragada Vari Street, Beside Maharaja Kitchen, Suryanarayana Puram, Andhra Pradesh – 533001',
    'phone', '+91 89194 92504',
    'whatsapp', '918919492504',
    'instagram', 'sri_sai_womensworld',
    'email', 'narinnovations@gmail.com',
    'gstin', '',
    'logo_url', '',
    'favicon_url', ''
  )),
  ('announcement', jsonb_build_object(
    'enabled', true,
    'items', jsonb_build_array(
      'Free Shipping above ₹999',
      '100% Secure Payments',
      'Easy 7-Day Returns',
      'Cash on Delivery Available',
      'New Arrivals Every Week'
    )
  )),
  ('whatsapp', jsonb_build_object(
    'enabled', true,
    'phone', '918919492504',
    'greeting', 'Hello! Welcome to VAARAHI. How may we help you today?'
  )),
  ('reels_section', jsonb_build_object(
    'enabled', true,
    'title', 'From Our Instagram',
    'subtitle', 'Follow @sri_sai_womensworld for daily inspiration'
  )),
  ('footer', jsonb_build_object(
    'about', 'A curated house of luxury jewellery, cosmetics and gifting — crafted for the modern Indian woman.',
    'maps_url', '',
    'facebook', '',
    'youtube', ''
  ))
ON CONFLICT (key) DO NOTHING;

-- Rename existing 'store' if it still says Satyabhama
UPDATE public.site_settings
SET value = value
  || jsonb_build_object('name', 'VAARAHI')
  || jsonb_build_object('tagline', 'Jewellery · Fashion · Accessories')
WHERE key = 'store' AND (value->>'name' IS NULL OR value->>'name' = 'Satyabhama' OR value->>'name' = '');
