-- ============================================================
-- MIGRATION: harden_supabase_security_performance_safe
-- Date: 2026-05-24
-- Safe changes only -- no structural RLS changes, no data risk
-- Applied in two steps via Supabase MCP:
--   1. harden_supabase_security_performance_safe_a_b_c (sections A/B/C)
--   2. harden_supabase_security_performance_safe_d_policies (section D)
-- ============================================================

-- ============================================================
-- SECTION A: Missing FK indexes (12)
-- CREATE INDEX IF NOT EXISTS is idempotent -- safe to re-run
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_loyalty_points_order_id
  ON public.loyalty_points (order_id);

CREATE INDEX IF NOT EXISTS idx_loyalty_points_user_id
  ON public.loyalty_points (user_id);

CREATE INDEX IF NOT EXISTS idx_order_items_product_id
  ON public.order_items (product_id);

CREATE INDEX IF NOT EXISTS idx_orders_shipping_method_id
  ON public.orders (shipping_method_id);

CREATE INDEX IF NOT EXISTS idx_product_reviews_user_id
  ON public.product_reviews (user_id);

CREATE INDEX IF NOT EXISTS idx_products_brand_id
  ON public.products (brand_id);

CREATE INDEX IF NOT EXISTS idx_products_collection_id
  ON public.products (collection_id);

CREATE INDEX IF NOT EXISTS idx_promo_code_usage_user_id
  ON public.promo_code_usage (user_id);

CREATE INDEX IF NOT EXISTS idx_referrals_referred_user_id
  ON public.referrals (referred_user_id);

CREATE INDEX IF NOT EXISTS idx_ticket_messages_sender_id
  ON public.ticket_messages (sender_id);

CREATE INDEX IF NOT EXISTS idx_visitors_user_id
  ON public.visitors (user_id);

CREATE INDEX IF NOT EXISTS idx_wishlists_product_id
  ON public.wishlists (product_id);

-- ============================================================
-- SECTION B: Fix search_path on all functions
-- Prevents search_path injection (CVE-class vulnerability)
-- ============================================================

ALTER FUNCTION public.is_admin()
  SET search_path = public, pg_temp;

ALTER FUNCTION public.increment_promo_code_usage(uuid)
  SET search_path = public, pg_temp;

ALTER FUNCTION public.increment_visit_count(character varying)
  SET search_path = public, pg_temp;

ALTER FUNCTION public.mark_abandoned_carts()
  SET search_path = public, pg_temp;

ALTER FUNCTION public.update_ticket_updated_at()
  SET search_path = public, pg_temp;

ALTER FUNCTION public.update_ticket_on_message()
  SET search_path = public, pg_temp;

ALTER FUNCTION public.archive_daily_stats()
  SET search_path = public, pg_temp;

ALTER FUNCTION public.update_updated_at_column()
  SET search_path = public, pg_temp;

ALTER FUNCTION public.generate_order_number()
  SET search_path = public, pg_temp;

-- ============================================================
-- SECTION C: Revoke increment_promo_code_usage from public roles
-- Only called via service_role; anon/authenticated have no use for it.
-- ============================================================

REVOKE EXECUTE ON FUNCTION public.increment_promo_code_usage(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.increment_promo_code_usage(uuid) FROM authenticated;

-- ============================================================
-- SECTION D: Optimize auth.uid() in RLS policies
-- Replace direct auth.uid() with (select auth.uid()) so the call
-- is evaluated once per statement, not once per row.
-- Uses DROP + CREATE (CREATE OR REPLACE POLICY rejected by Supabase MCP).
-- ============================================================

-- ---- addresses ----
DROP POLICY IF EXISTS "Users can delete own addresses" ON public.addresses;
CREATE POLICY "Users can delete own addresses"
ON public.addresses AS PERMISSIVE FOR DELETE TO public
USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own addresses" ON public.addresses;
CREATE POLICY "Users can insert own addresses"
ON public.addresses AS PERMISSIVE FOR INSERT TO public
WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own addresses" ON public.addresses;
CREATE POLICY "Users can update own addresses"
ON public.addresses AS PERMISSIVE FOR UPDATE TO public
USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can view own addresses" ON public.addresses;
CREATE POLICY "Users can view own addresses"
ON public.addresses AS PERMISSIVE FOR SELECT TO public
USING ((select auth.uid()) = user_id);

-- ---- loyalty_points ----
DROP POLICY IF EXISTS "Admins can manage all points" ON public.loyalty_points;
CREATE POLICY "Admins can manage all points"
ON public.loyalty_points AS PERMISSIVE FOR ALL TO public
USING (EXISTS (
  SELECT 1 FROM user_profiles
  WHERE (user_profiles.id = (select auth.uid())) AND (user_profiles.is_admin = true)
));

DROP POLICY IF EXISTS "Users can view their own points" ON public.loyalty_points;
CREATE POLICY "Users can view their own points"
ON public.loyalty_points AS PERMISSIVE FOR SELECT TO public
USING ((select auth.uid()) = user_id);

-- ---- orders ----
DROP POLICY IF EXISTS "Admins can update all orders" ON public.orders;
CREATE POLICY "Admins can update all orders"
ON public.orders AS PERMISSIVE FOR UPDATE TO public
USING (EXISTS (
  SELECT 1 FROM user_profiles
  WHERE (user_profiles.id = (select auth.uid())) AND (user_profiles.is_admin = true)
));

DROP POLICY IF EXISTS "Users and admins can view orders" ON public.orders;
CREATE POLICY "Users and admins can view orders"
ON public.orders AS PERMISSIVE FOR SELECT TO public
USING (
  ((select auth.uid()) = user_id)
  OR (user_id IS NULL)
  OR (EXISTS (
    SELECT 1 FROM user_profiles
    WHERE (user_profiles.id = (select auth.uid())) AND (user_profiles.is_admin = true)
  ))
);

DROP POLICY IF EXISTS "Users can insert own orders" ON public.orders;
CREATE POLICY "Users can insert own orders"
ON public.orders AS PERMISSIVE FOR INSERT TO public
WITH CHECK (((select auth.uid()) = user_id) OR (user_id IS NULL));

-- ---- promo_code_usage ----
DROP POLICY IF EXISTS "promo_code_usage_insert_own" ON public.promo_code_usage;
CREATE POLICY "promo_code_usage_insert_own"
ON public.promo_code_usage AS PERMISSIVE FOR INSERT TO public
WITH CHECK ((user_id = (select auth.uid())) OR (user_id IS NULL));

DROP POLICY IF EXISTS "promo_code_usage_select_own" ON public.promo_code_usage;
CREATE POLICY "promo_code_usage_select_own"
ON public.promo_code_usage AS PERMISSIVE FOR SELECT TO public
USING (user_id = (select auth.uid()));

-- ---- referrals ----
DROP POLICY IF EXISTS "referrals_select_own" ON public.referrals;
CREATE POLICY "referrals_select_own"
ON public.referrals AS PERMISSIVE FOR SELECT TO public
USING ((select auth.uid()) = referrer_user_id);

-- ---- tickets ----
DROP POLICY IF EXISTS "Admins can update all tickets" ON public.tickets;
CREATE POLICY "Admins can update all tickets"
ON public.tickets AS PERMISSIVE FOR UPDATE TO public
USING (EXISTS (
  SELECT 1 FROM user_profiles
  WHERE (user_profiles.id = (select auth.uid())) AND (user_profiles.is_admin = true)
));

DROP POLICY IF EXISTS "Admins can view all tickets" ON public.tickets;
CREATE POLICY "Admins can view all tickets"
ON public.tickets AS PERMISSIVE FOR SELECT TO public
USING (EXISTS (
  SELECT 1 FROM user_profiles
  WHERE (user_profiles.id = (select auth.uid())) AND (user_profiles.is_admin = true)
));

DROP POLICY IF EXISTS "Anyone can create tickets" ON public.tickets;
CREATE POLICY "Anyone can create tickets"
ON public.tickets AS PERMISSIVE FOR INSERT TO public
WITH CHECK ((user_id IS NULL) OR ((select auth.uid()) = user_id));

DROP POLICY IF EXISTS "Users can update own tickets" ON public.tickets;
CREATE POLICY "Users can update own tickets"
ON public.tickets AS PERMISSIVE FOR UPDATE TO public
USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can view own tickets only" ON public.tickets;
CREATE POLICY "Users can view own tickets only"
ON public.tickets AS PERMISSIVE FOR SELECT TO public
USING ((select auth.uid()) = user_id);

-- ---- ticket_messages ----
DROP POLICY IF EXISTS "Admins can send messages on all tickets" ON public.ticket_messages;
CREATE POLICY "Admins can send messages on all tickets"
ON public.ticket_messages AS PERMISSIVE FOR INSERT TO public
WITH CHECK (EXISTS (
  SELECT 1 FROM user_profiles
  WHERE (user_profiles.id = (select auth.uid())) AND (user_profiles.is_admin = true)
));

DROP POLICY IF EXISTS "Admins can view all messages" ON public.ticket_messages;
CREATE POLICY "Admins can view all messages"
ON public.ticket_messages AS PERMISSIVE FOR SELECT TO public
USING (EXISTS (
  SELECT 1 FROM user_profiles
  WHERE (user_profiles.id = (select auth.uid())) AND (user_profiles.is_admin = true)
));

DROP POLICY IF EXISTS "Users can send messages on own tickets" ON public.ticket_messages;
CREATE POLICY "Users can send messages on own tickets"
ON public.ticket_messages AS PERMISSIVE FOR INSERT TO public
WITH CHECK (EXISTS (
  SELECT 1 FROM tickets
  WHERE (tickets.id = ticket_messages.ticket_id) AND (tickets.user_id = (select auth.uid()))
));

DROP POLICY IF EXISTS "Users can view messages of own tickets" ON public.ticket_messages;
CREATE POLICY "Users can view messages of own tickets"
ON public.ticket_messages AS PERMISSIVE FOR SELECT TO public
USING (EXISTS (
  SELECT 1 FROM tickets
  WHERE (tickets.id = ticket_messages.ticket_id) AND (tickets.user_id = (select auth.uid()))
));

-- ---- user_profiles ----
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
CREATE POLICY "Users can insert own profile"
ON public.user_profiles AS PERMISSIVE FOR INSERT TO public
WITH CHECK ((select auth.uid()) = id);

DROP POLICY IF EXISTS "Users can read own profile" ON public.user_profiles;
CREATE POLICY "Users can read own profile"
ON public.user_profiles AS PERMISSIVE FOR SELECT TO public
USING ((select auth.uid()) = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
CREATE POLICY "Users can update own profile"
ON public.user_profiles AS PERMISSIVE FOR UPDATE TO public
USING ((select auth.uid()) = id);

DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
CREATE POLICY "Users can view own profile"
ON public.user_profiles AS PERMISSIVE FOR SELECT TO public
USING ((select auth.uid()) = id);

-- ---- wishlists ----
DROP POLICY IF EXISTS "Users can delete from own wishlist" ON public.wishlists;
CREATE POLICY "Users can delete from own wishlist"
ON public.wishlists AS PERMISSIVE FOR DELETE TO public
USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert to own wishlist" ON public.wishlists;
CREATE POLICY "Users can insert to own wishlist"
ON public.wishlists AS PERMISSIVE FOR INSERT TO public
WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can view own wishlist" ON public.wishlists;
CREATE POLICY "Users can view own wishlist"
ON public.wishlists AS PERMISSIVE FOR SELECT TO public
USING ((select auth.uid()) = user_id);

-- ---- accord_colors ----
DROP POLICY IF EXISTS "accord_colors_write_admin" ON public.accord_colors;
CREATE POLICY "accord_colors_write_admin"
ON public.accord_colors AS PERMISSIVE FOR ALL TO public
USING (EXISTS (
  SELECT 1 FROM user_profiles
  WHERE (user_profiles.id = (select auth.uid())) AND (user_profiles.is_admin = true)
));

-- ---- blog_posts ----
DROP POLICY IF EXISTS "Admins can manage posts" ON public.blog_posts;
CREATE POLICY "Admins can manage posts"
ON public.blog_posts AS PERMISSIVE FOR ALL TO public
USING (EXISTS (
  SELECT 1 FROM user_profiles
  WHERE (user_profiles.id = (select auth.uid())) AND (user_profiles.is_admin = true)
));

-- ---- note_images ----
DROP POLICY IF EXISTS "note_images_write_admin" ON public.note_images;
CREATE POLICY "note_images_write_admin"
ON public.note_images AS PERMISSIVE FOR ALL TO public
USING (EXISTS (
  SELECT 1 FROM user_profiles
  WHERE (user_profiles.id = (select auth.uid())) AND (user_profiles.is_admin = true)
));

-- ---- packs ----
DROP POLICY IF EXISTS "Admins can manage packs" ON public.packs;
CREATE POLICY "Admins can manage packs"
ON public.packs AS PERMISSIVE FOR ALL TO public
USING (EXISTS (
  SELECT 1 FROM user_profiles
  WHERE (user_profiles.id = (select auth.uid())) AND (user_profiles.is_admin = true)
));

-- ---- product_reviews ----
DROP POLICY IF EXISTS "reviews_admin_all" ON public.product_reviews;
CREATE POLICY "reviews_admin_all"
ON public.product_reviews AS PERMISSIVE FOR ALL TO public
USING (EXISTS (
  SELECT 1 FROM user_profiles
  WHERE (user_profiles.id = (select auth.uid())) AND (user_profiles.is_admin = true)
));

DROP POLICY IF EXISTS "reviews_insert_auth" ON public.product_reviews;
CREATE POLICY "reviews_insert_auth"
ON public.product_reviews AS PERMISSIVE FOR INSERT TO public
WITH CHECK (((select auth.uid()) IS NOT NULL) AND ((select auth.uid()) = user_id));

-- ---- promo_codes ----
DROP POLICY IF EXISTS "Admins can manage promo codes" ON public.promo_codes;
CREATE POLICY "Admins can manage promo codes"
ON public.promo_codes AS PERMISSIVE FOR ALL TO public
USING (EXISTS (
  SELECT 1 FROM user_profiles
  WHERE (user_profiles.id = (select auth.uid())) AND (user_profiles.is_admin = true)
))
WITH CHECK (EXISTS (
  SELECT 1 FROM user_profiles
  WHERE (user_profiles.id = (select auth.uid())) AND (user_profiles.is_admin = true)
));

-- ---- settings ----
DROP POLICY IF EXISTS "Only admins can insert settings" ON public.settings;
CREATE POLICY "Only admins can insert settings"
ON public.settings AS PERMISSIVE FOR INSERT TO public
WITH CHECK (EXISTS (
  SELECT 1 FROM user_profiles
  WHERE (user_profiles.id = (select auth.uid())) AND (user_profiles.is_admin = true)
));

DROP POLICY IF EXISTS "Only admins can update settings" ON public.settings;
CREATE POLICY "Only admins can update settings"
ON public.settings AS PERMISSIVE FOR UPDATE TO public
USING (EXISTS (
  SELECT 1 FROM user_profiles
  WHERE (user_profiles.id = (select auth.uid())) AND (user_profiles.is_admin = true)
));

-- ---- shipping_methods ----
DROP POLICY IF EXISTS "Admins can delete shipping methods" ON public.shipping_methods;
CREATE POLICY "Admins can delete shipping methods"
ON public.shipping_methods AS PERMISSIVE FOR DELETE TO public
USING (EXISTS (
  SELECT 1 FROM user_profiles
  WHERE (user_profiles.id = (select auth.uid())) AND (user_profiles.is_admin = true)
));

DROP POLICY IF EXISTS "Admins can insert shipping methods" ON public.shipping_methods;
CREATE POLICY "Admins can insert shipping methods"
ON public.shipping_methods AS PERMISSIVE FOR INSERT TO public
WITH CHECK (EXISTS (
  SELECT 1 FROM user_profiles
  WHERE (user_profiles.id = (select auth.uid())) AND (user_profiles.is_admin = true)
));

DROP POLICY IF EXISTS "Admins can read all shipping methods" ON public.shipping_methods;
CREATE POLICY "Admins can read all shipping methods"
ON public.shipping_methods AS PERMISSIVE FOR SELECT TO public
USING (EXISTS (
  SELECT 1 FROM user_profiles
  WHERE (user_profiles.id = (select auth.uid())) AND (user_profiles.is_admin = true)
));

DROP POLICY IF EXISTS "Admins can update shipping methods" ON public.shipping_methods;
CREATE POLICY "Admins can update shipping methods"
ON public.shipping_methods AS PERMISSIVE FOR UPDATE TO public
USING (EXISTS (
  SELECT 1 FROM user_profiles
  WHERE (user_profiles.id = (select auth.uid())) AND (user_profiles.is_admin = true)
));

-- ---- stock_alerts ----
DROP POLICY IF EXISTS "Admins can manage stock alerts" ON public.stock_alerts;
CREATE POLICY "Admins can manage stock alerts"
ON public.stock_alerts AS PERMISSIVE FOR ALL TO public
USING (EXISTS (
  SELECT 1 FROM user_profiles
  WHERE (user_profiles.id = (select auth.uid())) AND (user_profiles.is_admin = true)
));
