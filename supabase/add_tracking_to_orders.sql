-- ===========================================
-- Ajouter le numéro de suivi aux commandes
-- ===========================================

-- Ajouter la colonne tracking_number
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS tracking_number TEXT;

-- Ajouter la colonne tracking_url (lien direct vers le suivi)
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS tracking_url TEXT;

-- Ajouter la colonne carrier (transporteur)
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS carrier TEXT;

-- Ajouter la colonne shipped_at (date d'expédition)
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS shipped_at TIMESTAMPTZ;

-- Ajouter la colonne delivered_at (date de livraison)
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ;

-- Ajouter une colonne notes pour les commentaires internes
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS admin_notes TEXT;

-- ===========================================
-- Vérification
-- ===========================================
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'orders'
ORDER BY ordinal_position;
