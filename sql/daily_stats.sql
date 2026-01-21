-- =====================================================
-- TABLE DES STATS JOURNALIÈRES
-- =====================================================

-- Table pour stocker les stats de chaque jour
CREATE TABLE IF NOT EXISTS daily_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL UNIQUE,
  unique_visitors INTEGER DEFAULT 0,
  total_visits INTEGER DEFAULT 0,
  total_page_views INTEGER DEFAULT 0,
  new_visitors INTEGER DEFAULT 0,
  returning_visitors INTEGER DEFAULT 0,
  total_cart_value DECIMAL(10,2) DEFAULT 0,
  abandoned_carts INTEGER DEFAULT 0,
  converted_carts INTEGER DEFAULT 0,
  top_pages JSONB DEFAULT '[]'::jsonb, -- [{url, views}]
  device_breakdown JSONB DEFAULT '{}'::jsonb, -- {desktop: x, mobile: y, tablet: z}
  browser_breakdown JSONB DEFAULT '{}'::jsonb, -- {Chrome: x, Safari: y, etc}
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_daily_stats_date ON daily_stats(date DESC);

-- Activer RLS
ALTER TABLE daily_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow service role full access on daily_stats" ON daily_stats
  FOR ALL USING (true) WITH CHECK (true);

-- Table des visites journalières par IP (reset chaque jour)
CREATE TABLE IF NOT EXISTS daily_visits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  ip_address VARCHAR(45) NOT NULL,
  visitor_id VARCHAR(64) NOT NULL,
  visit_count INTEGER DEFAULT 1,
  first_visit_time TIMESTAMPTZ DEFAULT NOW(),
  last_visit_time TIMESTAMPTZ DEFAULT NOW(),
  pages_viewed INTEGER DEFAULT 0,
  device_type VARCHAR(50),
  browser VARCHAR(100),
  os VARCHAR(100),
  UNIQUE(date, ip_address)
);

CREATE INDEX IF NOT EXISTS idx_daily_visits_date ON daily_visits(date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_visits_ip ON daily_visits(ip_address);

-- Activer RLS
ALTER TABLE daily_visits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow service role full access on daily_visits" ON daily_visits
  FOR ALL USING (true) WITH CHECK (true);

-- =====================================================
-- FONCTION POUR ARCHIVER LES STATS JOURNALIÈRES
-- À exécuter chaque jour à minuit via un cron job
-- =====================================================

CREATE OR REPLACE FUNCTION archive_daily_stats()
RETURNS void AS $$
DECLARE
  yesterday DATE := CURRENT_DATE - INTERVAL '1 day';
  stats_record RECORD;
BEGIN
  -- Calculer les stats de la veille
  SELECT
    COUNT(DISTINCT dv.ip_address) as unique_visitors,
    COALESCE(SUM(dv.visit_count), 0) as total_visits,
    COALESCE((SELECT COUNT(*) FROM page_views WHERE created_at::date = yesterday), 0) as total_page_views,
    COUNT(DISTINCT CASE WHEN v.first_visit::date = yesterday THEN dv.ip_address END) as new_visitors,
    COUNT(DISTINCT CASE WHEN v.first_visit::date < yesterday THEN dv.ip_address END) as returning_visitors,
    COALESCE((SELECT SUM(subtotal) FROM active_carts WHERE last_activity::date = yesterday AND item_count > 0), 0) as total_cart_value,
    COALESCE((SELECT COUNT(*) FROM active_carts WHERE abandoned_at::date = yesterday), 0) as abandoned_carts,
    COALESCE((SELECT COUNT(*) FROM active_carts WHERE converted_at::date = yesterday), 0) as converted_carts
  INTO stats_record
  FROM daily_visits dv
  LEFT JOIN visitors v ON dv.visitor_id = v.visitor_id
  WHERE dv.date = yesterday;

  -- Insérer ou mettre à jour les stats
  INSERT INTO daily_stats (
    date,
    unique_visitors,
    total_visits,
    total_page_views,
    new_visitors,
    returning_visitors,
    total_cart_value,
    abandoned_carts,
    converted_carts,
    top_pages,
    device_breakdown,
    browser_breakdown
  )
  VALUES (
    yesterday,
    COALESCE(stats_record.unique_visitors, 0),
    COALESCE(stats_record.total_visits, 0),
    COALESCE(stats_record.total_page_views, 0),
    COALESCE(stats_record.new_visitors, 0),
    COALESCE(stats_record.returning_visitors, 0),
    COALESCE(stats_record.total_cart_value, 0),
    COALESCE(stats_record.abandoned_carts, 0),
    COALESCE(stats_record.converted_carts, 0),
    (
      SELECT COALESCE(jsonb_agg(jsonb_build_object('url', page_url, 'views', cnt)), '[]'::jsonb)
      FROM (
        SELECT page_url, COUNT(*) as cnt
        FROM page_views
        WHERE created_at::date = yesterday
        GROUP BY page_url
        ORDER BY cnt DESC
        LIMIT 10
      ) t
    ),
    (
      SELECT COALESCE(jsonb_object_agg(device_type, cnt), '{}'::jsonb)
      FROM (
        SELECT device_type, COUNT(*) as cnt
        FROM daily_visits
        WHERE date = yesterday
        GROUP BY device_type
      ) t
    ),
    (
      SELECT COALESCE(jsonb_object_agg(browser, cnt), '{}'::jsonb)
      FROM (
        SELECT browser, COUNT(*) as cnt
        FROM daily_visits
        WHERE date = yesterday
        GROUP BY browser
      ) t
    )
  )
  ON CONFLICT (date) DO UPDATE SET
    unique_visitors = EXCLUDED.unique_visitors,
    total_visits = EXCLUDED.total_visits,
    total_page_views = EXCLUDED.total_page_views,
    new_visitors = EXCLUDED.new_visitors,
    returning_visitors = EXCLUDED.returning_visitors,
    total_cart_value = EXCLUDED.total_cart_value,
    abandoned_carts = EXCLUDED.abandoned_carts,
    converted_carts = EXCLUDED.converted_carts,
    top_pages = EXCLUDED.top_pages,
    device_breakdown = EXCLUDED.device_breakdown,
    browser_breakdown = EXCLUDED.browser_breakdown;

  -- Nettoyer les anciennes données de daily_visits (garder 7 jours)
  DELETE FROM daily_visits WHERE date < CURRENT_DATE - INTERVAL '7 days';

  -- Nettoyer les anciennes page_views (garder 30 jours)
  DELETE FROM page_views WHERE created_at < CURRENT_DATE - INTERVAL '30 days';

END;
$$ LANGUAGE plpgsql;
