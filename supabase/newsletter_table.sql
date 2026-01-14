-- Table pour les abonnés à la newsletter
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  source VARCHAR(50) DEFAULT 'footer',
  unsubscribed_at TIMESTAMP WITH TIME ZONE
);

-- Index pour les recherches rapides
CREATE INDEX IF NOT EXISTS idx_newsletter_email ON newsletter_subscribers(email);
CREATE INDEX IF NOT EXISTS idx_newsletter_active ON newsletter_subscribers(is_active);

-- RLS policies
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes policies si elles existent
DROP POLICY IF EXISTS "Anyone can subscribe to newsletter" ON newsletter_subscribers;
DROP POLICY IF EXISTS "Admins can view subscribers" ON newsletter_subscribers;
DROP POLICY IF EXISTS "Admins can update subscribers" ON newsletter_subscribers;
DROP POLICY IF EXISTS "Admins can delete subscribers" ON newsletter_subscribers;
DROP POLICY IF EXISTS "Users can unsubscribe themselves" ON newsletter_subscribers;

-- Tout le monde peut s'inscrire (INSERT)
CREATE POLICY "Anyone can subscribe to newsletter" ON newsletter_subscribers
  FOR INSERT WITH CHECK (true);

-- Les utilisateurs authentifiés peuvent voir la liste (pour l'admin)
CREATE POLICY "Authenticated users can view subscribers" ON newsletter_subscribers
  FOR SELECT USING (auth.role() = 'authenticated');

-- Les utilisateurs authentifiés peuvent modifier (pour l'admin)
CREATE POLICY "Authenticated users can update subscribers" ON newsletter_subscribers
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Les utilisateurs authentifiés peuvent supprimer (pour l'admin)
CREATE POLICY "Authenticated users can delete subscribers" ON newsletter_subscribers
  FOR DELETE USING (auth.role() = 'authenticated');

-- Table pour l'historique des emails envoyés
CREATE TABLE IF NOT EXISTS newsletter_emails (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  subject VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sent_by UUID,
  recipients_count INTEGER DEFAULT 0,
  status VARCHAR(50) DEFAULT 'sent'
);

-- RLS pour newsletter_emails
ALTER TABLE newsletter_emails ENABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes policies si elles existent
DROP POLICY IF EXISTS "Admins can manage newsletter emails" ON newsletter_emails;
DROP POLICY IF EXISTS "Authenticated users can manage newsletter emails" ON newsletter_emails;

-- Les utilisateurs authentifiés peuvent gérer les emails
CREATE POLICY "Authenticated users can manage newsletter emails" ON newsletter_emails
  FOR ALL USING (auth.role() = 'authenticated');
