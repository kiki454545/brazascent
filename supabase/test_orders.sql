-- ===========================================
-- Mise à jour de la table orders + 5 commandes de test
-- Exécuter ce script dans le SQL Editor de Supabase
-- ===========================================

-- ÉTAPE 1 : Ajouter les colonnes manquantes à la table orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS items JSONB DEFAULT '[]'::jsonb;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_method VARCHAR(50) DEFAULT 'standard';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_url TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS carrier VARCHAR(50);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipped_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS admin_notes TEXT;

-- ÉTAPE 2 : Mettre à jour les policies pour permettre aux admins de tout voir/modifier
DROP POLICY IF EXISTS "Users can view own orders" ON orders;
DROP POLICY IF EXISTS "Admins can view all orders" ON orders;
DROP POLICY IF EXISTS "Admins can update all orders" ON orders;

CREATE POLICY "Users and admins can view orders" ON orders
  FOR SELECT USING (
    auth.uid() = user_id
    OR user_id IS NULL
    OR EXISTS (
      SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Admins can update all orders" ON orders
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_admin = true
    )
  );

-- ÉTAPE 3 : Supprimer les commandes de test existantes (si réexécution)
DELETE FROM orders WHERE order_number LIKE 'BS-TEST-%';

-- ===========================================
-- Commande 1 : En attente (nouvelle commande)
-- ===========================================
INSERT INTO orders (
  order_number,
  user_id,
  items,
  subtotal,
  shipping,
  total,
  status,
  shipping_method,
  payment_method,
  payment_status,
  shipping_address,
  created_at
) VALUES (
  'BS-TEST-001',
  NULL,
  '[{"product": {"id": "1", "name": "Oud Royal", "price": 89, "images": ["https://images.unsplash.com/photo-1541643600914-78b084683601?w=400"]}, "size": "5ml", "quantity": 2}]'::jsonb,
  178,
  0,
  178,
  'pending',
  'standard',
  'card',
  'completed',
  '{"firstName": "Marie", "lastName": "Dupont", "email": "marie.dupont@email.com", "phone": "06 12 34 56 78", "address": "15 Rue de la Paix", "city": "Paris", "postalCode": "75002", "country": "France"}'::jsonb,
  NOW() - INTERVAL '2 hours'
);

-- ===========================================
-- Commande 2 : En préparation
-- ===========================================
INSERT INTO orders (
  order_number,
  user_id,
  items,
  subtotal,
  shipping,
  total,
  status,
  shipping_method,
  payment_method,
  payment_status,
  shipping_address,
  created_at
) VALUES (
  'BS-TEST-002',
  NULL,
  '[{"product": {"id": "2", "name": "Rose Absolue", "price": 95, "images": ["https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=400"]}, "size": "10ml", "quantity": 1}, {"product": {"id": "3", "name": "Ambre Mystique", "price": 79, "images": ["https://images.unsplash.com/photo-1594035910387-fea47794261f?w=400"]}, "size": "5ml", "quantity": 1}]'::jsonb,
  174,
  5.90,
  179.90,
  'processing',
  'standard',
  'card',
  'completed',
  '{"firstName": "Jean", "lastName": "Martin", "email": "jean.martin@gmail.com", "phone": "07 98 76 54 32", "address": "28 Avenue des Champs-Élysées", "city": "Paris", "postalCode": "75008", "country": "France"}'::jsonb,
  NOW() - INTERVAL '1 day'
);

-- ===========================================
-- Commande 3 : Expédiée (avec numéro de suivi)
-- ===========================================
INSERT INTO orders (
  order_number,
  user_id,
  items,
  subtotal,
  shipping,
  total,
  status,
  shipping_method,
  payment_method,
  payment_status,
  shipping_address,
  tracking_number,
  tracking_url,
  carrier,
  shipped_at,
  created_at
) VALUES (
  'BS-TEST-003',
  NULL,
  '[{"product": {"id": "4", "name": "Noir Intense", "price": 110, "images": ["https://images.unsplash.com/photo-1587017539504-67cfbddac569?w=400"]}, "size": "10ml", "quantity": 1}]'::jsonb,
  110,
  0,
  110,
  'shipped',
  'express',
  'card',
  'completed',
  '{"firstName": "Sophie", "lastName": "Bernard", "email": "sophie.b@outlook.fr", "phone": "06 55 44 33 22", "address": "5 Rue du Commerce", "city": "Lyon", "postalCode": "69002", "country": "France"}'::jsonb,
  '6A12345678901',
  'https://www.laposte.fr/outils/suivre-vos-envois?code=6A12345678901',
  'colissimo',
  NOW() - INTERVAL '12 hours',
  NOW() - INTERVAL '3 days'
);

-- ===========================================
-- Commande 4 : Livrée
-- ===========================================
INSERT INTO orders (
  order_number,
  user_id,
  items,
  subtotal,
  shipping,
  total,
  status,
  shipping_method,
  payment_method,
  payment_status,
  shipping_address,
  tracking_number,
  tracking_url,
  carrier,
  shipped_at,
  delivered_at,
  created_at
) VALUES (
  'BS-TEST-004',
  NULL,
  '[{"product": {"id": "5", "name": "Bois Précieux", "price": 85, "images": ["https://images.unsplash.com/photo-1595425970377-c9703cf48b6d?w=400"]}, "size": "2ml", "quantity": 3}, {"product": {"id": "6", "name": "Fleur de Nuit", "price": 92, "images": ["https://images.unsplash.com/photo-1590736969955-71cc94901144?w=400"]}, "size": "5ml", "quantity": 1}]'::jsonb,
  347,
  0,
  347,
  'completed',
  'express',
  'card',
  'completed',
  '{"firstName": "Pierre", "lastName": "Leroy", "email": "p.leroy@free.fr", "phone": "06 11 22 33 44", "address": "42 Boulevard Haussmann", "city": "Marseille", "postalCode": "13001", "country": "France"}'::jsonb,
  'XJ987654321FR',
  'https://www.chronopost.fr/tracking-no-cms/suivi-page?liession=XJ987654321FR',
  'chronopost',
  NOW() - INTERVAL '5 days',
  NOW() - INTERVAL '3 days',
  NOW() - INTERVAL '7 days'
);

-- ===========================================
-- Commande 5 : Annulée
-- ===========================================
INSERT INTO orders (
  order_number,
  user_id,
  items,
  subtotal,
  shipping,
  total,
  status,
  shipping_method,
  payment_method,
  payment_status,
  shipping_address,
  admin_notes,
  created_at
) VALUES (
  'BS-TEST-005',
  NULL,
  '[{"product": {"id": "7", "name": "Cuir Sauvage", "price": 105, "images": ["https://images.unsplash.com/photo-1619994403073-2cec844b8e63?w=400"]}, "size": "10ml", "quantity": 2}]'::jsonb,
  210,
  5.90,
  215.90,
  'cancelled',
  'standard',
  'card',
  'refunded',
  '{"firstName": "Isabelle", "lastName": "Moreau", "email": "isa.moreau@yahoo.fr", "phone": "07 66 77 88 99", "address": "18 Rue de Rivoli", "city": "Bordeaux", "postalCode": "33000", "country": "France"}'::jsonb,
  'Client a demandé l''annulation - remboursement effectué le 10/01',
  NOW() - INTERVAL '10 days'
);

-- ===========================================
-- Vérification des commandes créées
-- ===========================================
SELECT
  order_number,
  total,
  status,
  tracking_number,
  created_at
FROM orders
WHERE order_number LIKE 'BS-TEST-%'
ORDER BY created_at DESC;
