-- ============================================================
-- MIGRATION: phase3_finalize_rls
-- Date: 2026-05-25
-- Suite de la phase 2 -- verrouillage final des INSERT ouverts
-- et restriction de newsletter_emails aux admins
-- ============================================================
-- AUDIT CONFIRMÉ (2026-05-25) :
--
-- orders INSERT :
--   → /api/webhook/stripe/route.ts ligne 270
--     supabaseAdmin.from('orders').insert({...})
--     createClient(URL, SUPABASE_SERVICE_ROLE_KEY) = service_role
--     Bypass RLS total. Aucun insert client confirme.
--
-- order_items INSERT :
--   → /api/webhook/stripe/route.ts ligne 326
--     supabaseAdmin.from('order_items').insert(orderItems)
--     createClient(URL, SUPABASE_SERVICE_ROLE_KEY) = service_role
--     Bypass RLS total. Aucun insert client confirme.
--
-- newsletter_emails :
--   → /admin/newsletter/page.tsx
--     import { supabase } from '@/lib/supabase' (anon+auth, admin connecte)
--     SELECT + INSERT uniquement par le dashboard admin
--     Jamais expose publiquement (public signup → newsletter_subscribers)
--   → /api/newsletter/send/route.ts
--     service_role mais ne touche PAS newsletter_emails
-- ============================================================

-- ============================================================
-- A) orders -- Supprimer les deux INSERT trop ouverts (with_check=true)
--
-- CONSERVEE intentionnellement :
--   "Users can insert own orders" (with_check = uid=user_id OR NULL)
--   → plus restrictive, sert de filet si le flow evolue
--
-- "Allow insert orders" et "Insertion orders" sont des doublons
-- avec with_check=true (tout le monde peut inserer) — inutiles
-- car le webhook utilise service_role qui bypass RLS.
-- ============================================================

DROP POLICY IF EXISTS "Allow insert orders" ON public.orders;
DROP POLICY IF EXISTS "Insertion orders" ON public.orders;

-- ============================================================
-- B) order_items -- Supprimer les deux INSERT trop ouverts (with_check=true)
--
-- Aucune policy INSERT de remplacement necessaire :
--   le webhook (service_role) bypass RLS entierement.
--   Tout insert non-service_role sera desormais refuse par RLS
--   (aucune policy matching = DENY pour les roles public/authenticated).
-- ============================================================

DROP POLICY IF EXISTS "Allow insert order_items" ON public.order_items;
DROP POLICY IF EXISTS "Insertion order_items" ON public.order_items;

-- ============================================================
-- C) newsletter_emails -- Remplacer la policy trop large
--
-- Probleme : "Authenticated users can manage newsletter emails"
--   qual = (auth.role() = 'authenticated') FOR ALL
--   → tout utilisateur connecte peut lire/ecrire les emails newsletter
--
-- Usage confirme : UNIQUEMENT le dashboard admin
--   /admin/newsletter/page.tsx → SELECT + INSERT via supabase(anon+auth)
--
-- SELECT public de newsletter_emails non necessaire au storefront.
-- (public signup → newsletter_subscribers, pas newsletter_emails)
-- ============================================================

DROP POLICY IF EXISTS "Authenticated users can manage newsletter emails" ON public.newsletter_emails;

CREATE POLICY "Admins can manage newsletter emails"
ON public.newsletter_emails AS PERMISSIVE FOR ALL TO public
USING (EXISTS (
  SELECT 1 FROM user_profiles
  WHERE user_profiles.id = (select auth.uid())
    AND user_profiles.is_admin = true
));
