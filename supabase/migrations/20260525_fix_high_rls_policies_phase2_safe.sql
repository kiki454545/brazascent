-- ============================================================
-- MIGRATION: fix_high_rls_policies_phase2_safe
-- Date: 2026-05-25
-- Objectif: corriger les risques hauts restants apres la phase 1
-- Patch minimal -- aucun INSERT touche, aucun frontend modifie
-- ============================================================
-- Analyse des clients Supabase verifiee dans le code :
--   orders INSERT    → /api/webhook/stripe service_role (bypass RLS) ✓
--   order_items INSERT → /api/webhook/stripe service_role (bypass RLS) ✓
--   orders UPDATE      → /admin/commandes supabase(anon+auth), is_admin=true
--   order_items SELECT → /compte/commandes supabase(anon+auth), filtre order_id
--   brands writes      → /admin/marques supabase(anon+auth), is_admin=true
--   settings upsert    → /admin/parametres supabase(anon+auth), is_admin=true
--   home_videos writes → /admin/videos createClient(ANON_KEY), is_admin=true
--   order_items guest  → /api/order-lookup service_role (bypass RLS) ✓
-- ============================================================

-- ============================================================
-- A) orders -- Supprimer "Modification orders"
--
-- Probleme : auth.role() = 'authenticated' → tout utilisateur connecte
--            peut modifier n'importe quelle commande
--
-- Policy conservee qui assure l'acces admin :
--   "Admins can update all orders" → EXISTS is_admin = true  ✓
--
-- Impact :
--   - Admin /admin/commandes appelle .update() sur orders via anon+auth
--   - is_admin=true → couvert par "Admins can update all orders" ✓
--   - INSERT checkout : service_role → non impacte ✓
-- ============================================================

DROP POLICY IF EXISTS "Modification orders" ON public.orders;

-- ============================================================
-- B) order_items -- Remplacer les deux SELECT qual=true
--
-- Probleme : "Lecture order_items" et "Users can view own order items"
--            ont toutes les deux qual=true → tout le monde lit tout
--
-- Solution : SELECT limite aux order_items des commandes du user ou admin
--
-- Clients verifies :
--   /compte/commandes → .from('order_items').select(...).eq('order_id', order.id)
--     Admin check via is_admin pour les admins ✓
--   /admin/commandes/[id]/bon-livraison → service_role (bypass RLS) ✓
--   /api/order-lookup → service_role (bypass RLS) ✓
--
-- INSERT INTENTIONNELLEMENT NON TOUCHE :
--   Checkout utilise service_role (confirme) mais les deux INSERT avec_check=true
--   sont laisses pour eviter tout risque de regression.
--   TODO: une fois le checkout 100% service_role confirme en prod,
--   verrouiller ces INSERT : WITH CHECK (EXISTS(SELECT 1 FROM orders
--   WHERE id=order_items.order_id AND user_id=(select auth.uid())))
-- ============================================================

DROP POLICY IF EXISTS "Lecture order_items" ON public.order_items;
DROP POLICY IF EXISTS "Users can view own order items" ON public.order_items;

CREATE POLICY "Users and admins can view order items"
ON public.order_items AS PERMISSIVE FOR SELECT TO public
USING (EXISTS (
  SELECT 1 FROM orders
  WHERE orders.id = order_items.order_id
  AND (
    orders.user_id = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = (select auth.uid())
        AND user_profiles.is_admin = true
    )
  )
));

-- ============================================================
-- C) brands -- Supprimer "Allow all operations on brands" (ALL qual=true)
--             et creer une policy d'ecriture admin uniquement
--
-- Probleme : FOR ALL avec USING=true et WITH CHECK=true
--            → tout le monde peut inserer/modifier/supprimer des marques
--
-- Policy SELECT conservee :
--   "Brands are viewable by everyone" → qual=true ✓ (catalogue public)
--
-- Admin /admin/marques utilise supabase(anon+auth) pour UPDATE/INSERT/DELETE
-- → couvert par la nouvelle policy admin ✓
-- ============================================================

DROP POLICY IF EXISTS "Allow all operations on brands" ON public.brands;

CREATE POLICY "Admins can manage brands"
ON public.brands AS PERMISSIVE FOR ALL TO public
USING (EXISTS (
  SELECT 1 FROM user_profiles
  WHERE user_profiles.id = (select auth.uid())
    AND user_profiles.is_admin = true
));

-- ============================================================
-- D) settings -- Supprimer "Modification settings"
--
-- Probleme : auth.role() = 'authenticated' → tout utilisateur connecte
--            peut modifier les settings (seuil livraison, textes, config)
--
-- Policies conservees qui assurent l'acces legitime :
--   "Only admins can update settings" → EXISTS is_admin = true ✓
--   "Only admins can insert settings" → EXISTS is_admin = true ✓
--   "Anyone can read settings"        → qual=true (storefront) ✓
--   "Lecture settings"                → qual=true (storefront) ✓
--
-- Admin /admin/parametres utilise UPSERT (INSERT + UPDATE)
-- → INSERT couvert par "Only admins can insert settings" ✓
-- → UPDATE couvert par "Only admins can update settings" ✓
-- ============================================================

DROP POLICY IF EXISTS "Modification settings" ON public.settings;

-- ============================================================
-- E) home_videos -- Supprimer "Admin full access" (ALL qual=true)
--                  et creer une policy admin uniquement
--
-- Probleme : FOR ALL avec USING=true → tout le monde peut inserer,
--            modifier, supprimer les videos de la homepage
--
-- Policy SELECT conservee :
--   "Public read active videos" → qual=(active=true) ✓
--
-- Admin /admin/videos utilise createClient(ANON_KEY) pour INSERT/UPDATE/DELETE
-- → couvert par la nouvelle policy admin ✓
-- ============================================================

DROP POLICY IF EXISTS "Admin full access" ON public.home_videos;

CREATE POLICY "Admins can manage home_videos"
ON public.home_videos AS PERMISSIVE FOR ALL TO public
USING (EXISTS (
  SELECT 1 FROM user_profiles
  WHERE user_profiles.id = (select auth.uid())
    AND user_profiles.is_admin = true
));
