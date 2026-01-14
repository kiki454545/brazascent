-- Ajouter la colonne stock_by_size à la table products
-- Cette colonne permet de gérer le stock par taille (2ml, 5ml, 10ml, etc.)

ALTER TABLE products
ADD COLUMN IF NOT EXISTS stock_by_size JSONB DEFAULT '{}';

-- Mettre à jour les produits existants pour initialiser stock_by_size à partir du stock actuel
-- Ceci répartit le stock total équitablement entre les tailles définies
UPDATE products
SET stock_by_size = (
  SELECT jsonb_object_agg(size, FLOOR(stock / array_length(sizes, 1)))
  FROM unnest(sizes) AS size
)
WHERE stock_by_size = '{}' OR stock_by_size IS NULL;

-- Exemple de requête pour vérifier
-- SELECT name, sizes, stock, stock_by_size FROM products;
