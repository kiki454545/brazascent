-- Créer la table products pour stocker les parfums
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  brand TEXT DEFAULT 'Braza Scent',
  short_description TEXT,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  original_price DECIMAL(10,2),
  collection TEXT DEFAULT 'Signature',
  category TEXT DEFAULT 'Eau de Parfum',
  gender TEXT DEFAULT 'Unisexe',
  sizes TEXT[] DEFAULT ARRAY['50ml', '100ml'],
  notes_top TEXT[] DEFAULT '{}',
  notes_heart TEXT[] DEFAULT '{}',
  notes_base TEXT[] DEFAULT '{}',
  images TEXT[] DEFAULT '{}',
  stock INTEGER DEFAULT 0,
  is_new BOOLEAN DEFAULT true,
  is_bestseller BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour les recherches
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_collection ON products(collection);
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);

-- Fonction pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger pour mettre à jour updated_at automatiquement
DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Politique RLS : tout le monde peut lire les produits actifs
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active products" ON products
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can read all products" ON products
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Only admins can insert products" ON products
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Only admins can update products" ON products
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Only admins can delete products" ON products
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Créer un bucket pour les images des produits (à exécuter dans Supabase Storage)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('products', 'products', true);
