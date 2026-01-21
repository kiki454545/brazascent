-- =====================================================
-- CORRECTIFS SÉCURITÉ RLS - À EXÉCUTER DANS SUPABASE
-- =====================================================

-- 1. CORRIGER les policies trop permissives sur tracking_tables
-- Ces policies "USING (true)" permettent l'accès public à tous

-- Supprimer les anciennes policies permissives
DROP POLICY IF EXISTS "Allow service role full access on visitors" ON visitors;
DROP POLICY IF EXISTS "Allow service role full access on page_views" ON page_views;
DROP POLICY IF EXISTS "Allow service role full access on active_carts" ON active_carts;
DROP POLICY IF EXISTS "Allow service role full access on visitor_sessions" ON visitor_sessions;

-- Créer des policies restrictives (deny all pour les clients, seul le service role peut accéder)
-- Note: Le service role bypass RLS par défaut, donc on bloque simplement l'accès public

CREATE POLICY "Deny public access on visitors" ON visitors
  FOR ALL USING (false);

CREATE POLICY "Deny public access on page_views" ON page_views
  FOR ALL USING (false);

CREATE POLICY "Deny public access on active_carts" ON active_carts
  FOR ALL USING (false);

CREATE POLICY "Deny public access on visitor_sessions" ON visitor_sessions
  FOR ALL USING (false);

-- 2. CORRIGER les policies sur daily_visits et daily_stats

DROP POLICY IF EXISTS "Allow service role full access on daily_visits" ON daily_visits;
DROP POLICY IF EXISTS "Allow service role full access on daily_stats" ON daily_stats;

CREATE POLICY "Deny public access on daily_visits" ON daily_visits
  FOR ALL USING (false);

CREATE POLICY "Deny public access on daily_stats" ON daily_stats
  FOR ALL USING (false);

-- 3. CORRIGER la policy promo_codes qui référence 'profiles' au lieu de 'user_profiles'

-- D'abord supprimer l'ancienne policy si elle existe
DROP POLICY IF EXISTS "Admins can manage promo codes" ON promo_codes;
DROP POLICY IF EXISTS "admins_manage_promo_codes" ON promo_codes;

-- Recréer avec la bonne table (user_profiles)
CREATE POLICY "Admins can manage promo codes" ON promo_codes
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
    )
  );

-- 4. S'assurer que RLS est activé sur toutes les tables sensibles
ALTER TABLE visitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE active_carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE visitor_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;

-- 5. Vérification: lister toutes les policies après correction
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
-- FROM pg_policies
-- WHERE tablename IN ('visitors', 'page_views', 'active_carts', 'visitor_sessions', 'daily_visits', 'daily_stats', 'promo_codes');
