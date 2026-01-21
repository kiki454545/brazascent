-- Ajouter les champs pour le suivi des emails de panier abandonné
ALTER TABLE active_carts ADD COLUMN IF NOT EXISTS recovery_email_sent BOOLEAN DEFAULT false;
ALTER TABLE active_carts ADD COLUMN IF NOT EXISTS recovery_email_sent_at TIMESTAMPTZ;
ALTER TABLE active_carts ADD COLUMN IF NOT EXISTS recovery_promo_code TEXT;

-- Mettre à jour les paniers existants
UPDATE active_carts SET recovery_email_sent = false WHERE recovery_email_sent IS NULL;
