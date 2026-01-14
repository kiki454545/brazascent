-- Créer la table settings pour stocker les paramètres du site
CREATE TABLE IF NOT EXISTS settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insérer les paramètres par défaut
INSERT INTO settings (key, value) VALUES
  ('store', '{
    "storeName": "Braza Scent",
    "storeEmail": "contact@brazascent.com",
    "storePhone": "+33 1 23 45 67 89",
    "storeAddress": "123 Avenue des Champs-Élysées, 75008 Paris",
    "currency": "EUR"
  }'::jsonb),
  ('shipping', '{
    "freeShippingThreshold": 150,
    "standardShippingPrice": 9.90,
    "expressShippingPrice": 14.90
  }'::jsonb),
  ('payment', '{
    "taxRate": 20,
    "paymentMethods": ["card", "paypal", "applepay", "googlepay"]
  }'::jsonb),
  ('notifications', '{
    "enableNotifications": true,
    "enableEmailConfirmation": false,
    "maintenanceMode": false
  }'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- Politique RLS : tout le monde peut lire, seuls les admins peuvent modifier
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read settings" ON settings
  FOR SELECT USING (true);

CREATE POLICY "Only admins can update settings" ON settings
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Only admins can insert settings" ON settings
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );
