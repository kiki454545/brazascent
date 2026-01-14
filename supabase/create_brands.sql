-- Créer la table brands si elle n'existe pas
CREATE TABLE IF NOT EXISTS brands (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  logo TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activer RLS
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;

-- Politique pour permettre toutes les opérations
DROP POLICY IF EXISTS "Allow all operations on brands" ON brands;
CREATE POLICY "Allow all operations on brands" ON brands
FOR ALL USING (true) WITH CHECK (true);

-- Supprimer les anciennes marques si elles existent
DELETE FROM brands;

-- Insérer les marques
INSERT INTO brands (name, slug, description, logo) VALUES
(
  'Braza Scent',
  'braza-scent',
  'Notre maison de parfumerie, créatrice de fragrances d''exception depuis notre fondation.',
  'https://images.unsplash.com/photo-1541643600914-78b084683601?w=800'
),
(
  'Maison Royale',
  'maison-royale',
  'L''excellence de la parfumerie française traditionnelle, héritière d''un savoir-faire séculaire.',
  'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=800'
),
(
  'Oud Orient',
  'oud-orient',
  'Spécialiste des fragrances orientales et des ouds les plus précieux du monde.',
  'https://images.unsplash.com/photo-1587017539504-67cfbddac569?w=800'
),
(
  'Fleur de Paris',
  'fleur-de-paris',
  'Des compositions florales raffinées, inspirées des jardins parisiens.',
  'https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?w=800'
),
(
  'Noir Absolu',
  'noir-absolu',
  'Des créations audacieuses et intenses pour les amateurs de fragrances puissantes.',
  'https://images.unsplash.com/photo-1594035910387-fea47794261f?w=800'
),
(
  'Essence Pure',
  'essence-pure',
  'La pureté des ingrédients naturels dans des compositions minimalistes et élégantes.',
  'https://images.unsplash.com/photo-1595425970377-c9703cf48b6d?w=800'
);

-- Vérifier les marques insérées
SELECT * FROM brands ORDER BY name;
