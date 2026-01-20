-- =====================================================
-- CORRECTION SÉCURITÉ: RLS Policies pour tickets
-- À exécuter dans Supabase SQL Editor
-- =====================================================

-- Supprimer les anciennes policies trop permissives
DROP POLICY IF EXISTS "Users can view their own tickets" ON tickets;
DROP POLICY IF EXISTS "Users can create tickets" ON tickets;
DROP POLICY IF EXISTS "Allow update tickets" ON tickets;
DROP POLICY IF EXISTS "Users can view messages" ON ticket_messages;
DROP POLICY IF EXISTS "Users can send messages" ON ticket_messages;

-- =====================================================
-- NOUVELLES POLICIES SÉCURISÉES POUR TICKETS
-- =====================================================

-- Les utilisateurs ne peuvent voir QUE leurs propres tickets
CREATE POLICY "Users can view own tickets only" ON tickets
  FOR SELECT USING (auth.uid() = user_id);

-- Les admins peuvent voir tous les tickets
CREATE POLICY "Admins can view all tickets" ON tickets
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
    )
  );

-- Tout le monde peut créer un ticket (même non connecté via user_id NULL)
CREATE POLICY "Anyone can create tickets" ON tickets
  FOR INSERT WITH CHECK (
    user_id IS NULL OR auth.uid() = user_id
  );

-- Les utilisateurs peuvent mettre à jour leurs propres tickets
CREATE POLICY "Users can update own tickets" ON tickets
  FOR UPDATE USING (auth.uid() = user_id);

-- Les admins peuvent mettre à jour tous les tickets
CREATE POLICY "Admins can update all tickets" ON tickets
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
    )
  );

-- =====================================================
-- NOUVELLES POLICIES SÉCURISÉES POUR TICKET_MESSAGES
-- =====================================================

-- Les utilisateurs ne peuvent voir que les messages de leurs propres tickets
CREATE POLICY "Users can view messages of own tickets" ON ticket_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM tickets
      WHERE tickets.id = ticket_messages.ticket_id
      AND tickets.user_id = auth.uid()
    )
  );

-- Les admins peuvent voir tous les messages
CREATE POLICY "Admins can view all messages" ON ticket_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
    )
  );

-- Les utilisateurs ne peuvent envoyer des messages que sur leurs propres tickets
CREATE POLICY "Users can send messages on own tickets" ON ticket_messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM tickets
      WHERE tickets.id = ticket_messages.ticket_id
      AND tickets.user_id = auth.uid()
    )
  );

-- Les admins peuvent envoyer des messages sur tous les tickets
CREATE POLICY "Admins can send messages on all tickets" ON ticket_messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
    )
  );

-- =====================================================
-- VÉRIFICATION
-- =====================================================
-- Pour vérifier que les policies sont bien appliquées:
-- SELECT schemaname, tablename, policyname, cmd, qual
-- FROM pg_policies
-- WHERE tablename IN ('tickets', 'ticket_messages');
