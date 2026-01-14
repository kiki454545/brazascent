-- ===========================================
-- Script pour créer les buckets de stockage Supabase
-- Exécuter ce script dans le SQL Editor de Supabase
-- ===========================================

-- Créer le bucket pour les images de produits
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'products',
  'products',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- Créer le bucket pour les logos de marques
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'brands',
  'brands',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];

-- ===========================================
-- Policies pour le bucket 'products'
-- ===========================================

-- Permettre la lecture publique des images de produits
DROP POLICY IF EXISTS "Products images are publicly accessible" ON storage.objects;
CREATE POLICY "Products images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'products');

-- Permettre l'upload pour les utilisateurs authentifiés
DROP POLICY IF EXISTS "Authenticated users can upload product images" ON storage.objects;
CREATE POLICY "Authenticated users can upload product images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'products'
  AND auth.role() = 'authenticated'
);

-- Permettre la suppression pour les utilisateurs authentifiés
DROP POLICY IF EXISTS "Authenticated users can delete product images" ON storage.objects;
CREATE POLICY "Authenticated users can delete product images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'products'
  AND auth.role() = 'authenticated'
);

-- Permettre la mise à jour pour les utilisateurs authentifiés
DROP POLICY IF EXISTS "Authenticated users can update product images" ON storage.objects;
CREATE POLICY "Authenticated users can update product images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'products'
  AND auth.role() = 'authenticated'
);

-- ===========================================
-- Policies pour le bucket 'brands'
-- ===========================================

-- Permettre la lecture publique des logos de marques
DROP POLICY IF EXISTS "Brand logos are publicly accessible" ON storage.objects;
CREATE POLICY "Brand logos are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'brands');

-- Permettre l'upload pour les utilisateurs authentifiés
DROP POLICY IF EXISTS "Authenticated users can upload brand logos" ON storage.objects;
CREATE POLICY "Authenticated users can upload brand logos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'brands'
  AND auth.role() = 'authenticated'
);

-- Permettre la suppression pour les utilisateurs authentifiés
DROP POLICY IF EXISTS "Authenticated users can delete brand logos" ON storage.objects;
CREATE POLICY "Authenticated users can delete brand logos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'brands'
  AND auth.role() = 'authenticated'
);

-- Permettre la mise à jour pour les utilisateurs authentifiés
DROP POLICY IF EXISTS "Authenticated users can update brand logos" ON storage.objects;
CREATE POLICY "Authenticated users can update brand logos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'brands'
  AND auth.role() = 'authenticated'
);

-- ===========================================
-- Vérification
-- ===========================================
SELECT id, name, public, file_size_limit, allowed_mime_types
FROM storage.buckets
WHERE id IN ('products', 'brands');
