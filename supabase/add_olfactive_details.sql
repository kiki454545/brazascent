-- Migration : ajout des détails olfactifs sur les produits
-- À exécuter dans l'éditeur SQL de Supabase

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS main_accords JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS note_images  JSONB DEFAULT '{}'::jsonb;
