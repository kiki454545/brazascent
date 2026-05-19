-- ===========================================
-- Table shipping_methods + bucket de stockage
-- ===========================================

CREATE TABLE IF NOT EXISTS shipping_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  description_2 TEXT,
  price NUMERIC(10, 2) NOT NULL DEFAULT 0,
  image_url TEXT,
  badge TEXT,
  free_threshold NUMERIC(10, 2),
  sort_order INT NOT NULL DEFAULT 0,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shipping_methods_enabled_sort
  ON shipping_methods (enabled, sort_order);

ALTER TABLE shipping_methods ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read enabled shipping methods" ON shipping_methods;
CREATE POLICY "Anyone can read enabled shipping methods"
  ON shipping_methods FOR SELECT
  USING (enabled = true);

DROP POLICY IF EXISTS "Admins can read all shipping methods" ON shipping_methods;
CREATE POLICY "Admins can read all shipping methods"
  ON shipping_methods FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

DROP POLICY IF EXISTS "Admins can insert shipping methods" ON shipping_methods;
CREATE POLICY "Admins can insert shipping methods"
  ON shipping_methods FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

DROP POLICY IF EXISTS "Admins can update shipping methods" ON shipping_methods;
CREATE POLICY "Admins can update shipping methods"
  ON shipping_methods FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

DROP POLICY IF EXISTS "Admins can delete shipping methods" ON shipping_methods;
CREATE POLICY "Admins can delete shipping methods"
  ON shipping_methods FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- ===========================================
-- Bucket de stockage pour les images de méthodes
-- ===========================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'shipping-methods',
  'shipping-methods',
  true,
  2097152, -- 2MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 2097152,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];

DROP POLICY IF EXISTS "Shipping method images are publicly accessible" ON storage.objects;
CREATE POLICY "Shipping method images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'shipping-methods');

DROP POLICY IF EXISTS "Authenticated users can upload shipping method images" ON storage.objects;
CREATE POLICY "Authenticated users can upload shipping method images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'shipping-methods' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can update shipping method images" ON storage.objects;
CREATE POLICY "Authenticated users can update shipping method images"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'shipping-methods' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can delete shipping method images" ON storage.objects;
CREATE POLICY "Authenticated users can delete shipping method images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'shipping-methods' AND auth.role() = 'authenticated');

-- ===========================================
-- Ajouter shipping_method_id sur orders (legacy shipping_method conservé)
-- ===========================================

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS shipping_method_id UUID REFERENCES shipping_methods(id);

-- ===========================================
-- Données initiales : 3 méthodes par défaut
-- ===========================================

INSERT INTO shipping_methods (title, description, description_2, price, badge, free_threshold, sort_order, enabled)
VALUES
  ('Livraison Standard', 'Livraison à votre domicile', '3 à 5 jours ouvrés', 9.90, NULL, 150, 1, true),
  ('Livraison Express', 'Livraison rapide à domicile', '1 à 2 jours ouvrés', 14.90, NULL, NULL, 2, true)
ON CONFLICT DO NOTHING;

-- ===========================================
-- Migration des commandes existantes : associer shipping_method (texte) à un ID
-- ===========================================

UPDATE orders o
SET shipping_method_id = sm.id
FROM shipping_methods sm
WHERE o.shipping_method_id IS NULL
  AND (
    (o.shipping_method = 'standard' AND sm.title = 'Livraison Standard') OR
    (o.shipping_method = 'express'  AND sm.title = 'Livraison Express')
  );

-- ===========================================
-- Vérification
-- ===========================================
SELECT id, title, price, enabled, sort_order FROM shipping_methods ORDER BY sort_order;
