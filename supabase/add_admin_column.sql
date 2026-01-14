-- Ajouter la colonne is_admin à user_profiles si elle n'existe pas
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- Mettre à jour un utilisateur spécifique comme admin (remplacer l'email par le vôtre)
-- UPDATE user_profiles SET is_admin = true WHERE email = 'votre@email.com';

-- Ou mettre à jour par ID
-- UPDATE user_profiles SET is_admin = true WHERE id = 'votre-user-id';

-- Créer une politique pour que seuls les admins puissent modifier is_admin
CREATE POLICY IF NOT EXISTS "Only admins can update is_admin" ON user_profiles
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid() AND is_admin = true
  )
);
