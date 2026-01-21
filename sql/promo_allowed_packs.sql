-- Ajouter la colonne promo_allowed à la table packs
-- Par défaut true (codes promo autorisés)

ALTER TABLE packs ADD COLUMN IF NOT EXISTS promo_allowed BOOLEAN DEFAULT true;

-- Mettre à jour les packs existants pour avoir promo_allowed = true
UPDATE packs SET promo_allowed = true WHERE promo_allowed IS NULL;
