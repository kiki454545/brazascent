-- ============================================================
-- MIGRATION: fix_critical_rls_policies
-- Date: 2026-05-24
-- Objectif: corriger 3 policies RLS critiques (qual=true / trop permissives)
-- Patch minimal -- aucune modification des INSERT, tables ou frontend
-- ============================================================

-- ============================================================
-- A) user_profiles -- Supprimer "Lecture profil" (qual=true)
--
-- Problème: toute requête (même anon) pouvait lire tous les profils
--           → fuite RGPD (email, is_admin, etc.)
--
-- Policies conservées qui assurent l'accès légitime:
--   "Users can read own profile"    → (select auth.uid()) = id
--   "Users can view own profile"    → (select auth.uid()) = id
--   "Admins can read all profiles"  → is_admin()
--
-- Impact vérifié:
--   - Frontend admin: utilise service_role (bypass RLS) ✓
--   - is_admin() SECURITY DEFINER: lit user_profiles comme postgres (bypass RLS) ✓
--   - RLS subqueries admin: admin lit sa propre ligne via uid=id ✓
-- ============================================================

DROP POLICY IF EXISTS "Lecture profil" ON public.user_profiles;

-- ============================================================
-- B) orders -- Supprimer "Lecture orders" (qual=true)
--
-- Problème: n'importe qui pouvait lire toutes les commandes
--           → fuite données clients (adresse, montant, statut)
--
-- Policies conservées qui assurent l'accès légitime:
--   "Users and admins can view orders" → uid=user_id OR guest OR is_admin
--
-- Impact vérifié:
--   - /api/checkout: service_role → bypass RLS ✓
--   - /api/order-lookup: service_role → bypass RLS ✓
--   - /api/webhook/stripe: service_role → bypass RLS ✓
--   - /compte/commandes: filtre user_id=user.id → couvert par policy existante ✓
--   - Admin commandes: admin authenticated + is_admin=true → couvert ✓
--   - Homepage count: retournera les commandes guest (user_id IS NULL) pour anon
--     → compte partiel mais non-zéro, fallback "100 + count || 0" intact ✓
-- ============================================================

DROP POLICY IF EXISTS "Lecture orders" ON public.orders;

-- ============================================================
-- C) products -- Supprimer "Allow update products" (qual=true)
--              ET restreindre "Modification products" aux admins
--
-- Problème 1: "Allow update products" qual=true → n'importe qui peut modifier
-- Problème 2: "Modification products" auth.role()='authenticated' → tout utilisateur
--             connecté (client, shopper) peut modifier les produits
--
-- Objectif: UPDATE réservé exclusivement aux admins et service_role
--
-- Impact vérifié:
--   - Admin /admin/produits/[id]: supabase(anon+authenticated), is_admin=true
--     → EXISTS subquery lit user_profiles.is_admin via uid=id (propre ligne) ✓
--   - Admin /admin/promos: même pattern ✓
--   - /api/webhook/stripe: service_role → bypass RLS ✓
--   - SELECT public du catalogue: non touché (policies SELECT inchangées) ✓
-- ============================================================

DROP POLICY IF EXISTS "Allow update products" ON public.products;

DROP POLICY IF EXISTS "Modification products" ON public.products;
CREATE POLICY "Modification products"
ON public.products AS PERMISSIVE FOR UPDATE TO public
USING (EXISTS (
  SELECT 1 FROM user_profiles
  WHERE (user_profiles.id = (select auth.uid())) AND (user_profiles.is_admin = true)
));
