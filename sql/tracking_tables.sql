-- =====================================================
-- SYSTÈME DE TRACKING DES VISITEURS
-- =====================================================

-- Table des visiteurs (par IP/fingerprint)
CREATE TABLE IF NOT EXISTS visitors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  visitor_id VARCHAR(64) NOT NULL UNIQUE, -- Hash de l'IP + user agent
  ip_address VARCHAR(45), -- IPv4 ou IPv6
  user_agent TEXT,
  country VARCHAR(100),
  city VARCHAR(100),
  device_type VARCHAR(50), -- mobile, desktop, tablet
  browser VARCHAR(100),
  os VARCHAR(100),
  first_visit TIMESTAMPTZ DEFAULT NOW(),
  last_visit TIMESTAMPTZ DEFAULT NOW(),
  visit_count INTEGER DEFAULT 1,
  is_bot BOOLEAN DEFAULT FALSE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Si connecté
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour les recherches
CREATE INDEX IF NOT EXISTS idx_visitors_visitor_id ON visitors(visitor_id);
CREATE INDEX IF NOT EXISTS idx_visitors_last_visit ON visitors(last_visit DESC);
CREATE INDEX IF NOT EXISTS idx_visitors_is_bot ON visitors(is_bot);

-- Table des pages vues
CREATE TABLE IF NOT EXISTS page_views (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  visitor_id VARCHAR(64) NOT NULL,
  page_url TEXT NOT NULL,
  page_title VARCHAR(255),
  referrer TEXT,
  session_id VARCHAR(64), -- Pour grouper les pages d'une même session
  time_on_page INTEGER, -- En secondes
  scroll_depth INTEGER, -- Pourcentage de scroll
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour les analyses
CREATE INDEX IF NOT EXISTS idx_page_views_visitor_id ON page_views(visitor_id);
CREATE INDEX IF NOT EXISTS idx_page_views_created_at ON page_views(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_page_views_page_url ON page_views(page_url);
CREATE INDEX IF NOT EXISTS idx_page_views_session_id ON page_views(session_id);

-- Table des paniers actifs (synchronisés depuis le client)
CREATE TABLE IF NOT EXISTS active_carts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  visitor_id VARCHAR(64) NOT NULL,
  session_id VARCHAR(64),
  items JSONB DEFAULT '[]'::jsonb, -- [{product_id, name, size, quantity, price, image}]
  subtotal DECIMAL(10,2) DEFAULT 0,
  item_count INTEGER DEFAULT 0,
  last_activity TIMESTAMPTZ DEFAULT NOW(),
  abandoned_at TIMESTAMPTZ, -- Marqué abandonné après X heures d'inactivité
  converted_at TIMESTAMPTZ, -- Si le panier a été converti en commande
  user_email VARCHAR(255), -- Si on a capturé l'email
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(visitor_id)
);

-- Index pour les paniers
CREATE INDEX IF NOT EXISTS idx_active_carts_visitor_id ON active_carts(visitor_id);
CREATE INDEX IF NOT EXISTS idx_active_carts_last_activity ON active_carts(last_activity DESC);
CREATE INDEX IF NOT EXISTS idx_active_carts_abandoned ON active_carts(abandoned_at) WHERE abandoned_at IS NOT NULL;

-- Table des sessions (pour grouper les visites)
CREATE TABLE IF NOT EXISTS visitor_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id VARCHAR(64) NOT NULL UNIQUE,
  visitor_id VARCHAR(64) NOT NULL,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  page_count INTEGER DEFAULT 0,
  duration INTEGER, -- En secondes
  entry_page TEXT,
  exit_page TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_visitor_sessions_session_id ON visitor_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_visitor_sessions_visitor_id ON visitor_sessions(visitor_id);

-- =====================================================
-- FONCTIONS UTILITAIRES
-- =====================================================

-- Fonction pour mettre à jour le compteur de visites
CREATE OR REPLACE FUNCTION increment_visit_count(p_visitor_id VARCHAR(64))
RETURNS void AS $$
BEGIN
  UPDATE visitors
  SET visit_count = visit_count + 1,
      last_visit = NOW()
  WHERE visitor_id = p_visitor_id;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour marquer les paniers abandonnés (à exécuter via un cron job)
CREATE OR REPLACE FUNCTION mark_abandoned_carts()
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE active_carts
  SET abandoned_at = NOW()
  WHERE abandoned_at IS NULL
    AND converted_at IS NULL
    AND item_count > 0
    AND last_activity < NOW() - INTERVAL '2 hours';

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- POLITIQUES RLS (Row Level Security)
-- =====================================================

-- Activer RLS
ALTER TABLE visitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE active_carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE visitor_sessions ENABLE ROW LEVEL SECURITY;

-- Politiques pour permettre l'insertion depuis l'API (service role)
CREATE POLICY "Allow service role full access on visitors" ON visitors
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow service role full access on page_views" ON page_views
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow service role full access on active_carts" ON active_carts
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow service role full access on visitor_sessions" ON visitor_sessions
  FOR ALL USING (true) WITH CHECK (true);

-- =====================================================
-- VUES POUR LE DASHBOARD ADMIN
-- =====================================================

-- Vue des stats visiteurs aujourd'hui
CREATE OR REPLACE VIEW visitors_today AS
SELECT
  COUNT(DISTINCT visitor_id) as unique_visitors,
  COUNT(*) as total_page_views,
  COUNT(DISTINCT session_id) as total_sessions
FROM page_views
WHERE created_at >= CURRENT_DATE;

-- Vue des pages les plus visitées
CREATE OR REPLACE VIEW top_pages AS
SELECT
  page_url,
  COUNT(*) as view_count,
  COUNT(DISTINCT visitor_id) as unique_visitors
FROM page_views
WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY page_url
ORDER BY view_count DESC
LIMIT 20;

-- Vue des paniers actifs non abandonnés
CREATE OR REPLACE VIEW active_carts_summary AS
SELECT
  COUNT(*) as total_carts,
  SUM(subtotal) as total_value,
  SUM(item_count) as total_items
FROM active_carts
WHERE abandoned_at IS NULL
  AND converted_at IS NULL
  AND item_count > 0
  AND last_activity > NOW() - INTERVAL '24 hours';
