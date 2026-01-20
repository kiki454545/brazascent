-- Table des tickets de support
CREATE TABLE IF NOT EXISTS tickets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  user_name TEXT,
  subject TEXT NOT NULL,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  category TEXT DEFAULT 'general' CHECK (category IN ('general', 'order', 'product', 'delivery', 'refund', 'other')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des messages dans les tickets
CREATE TABLE IF NOT EXISTS ticket_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('user', 'admin')),
  sender_name TEXT,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_tickets_user_id ON tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON tickets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ticket_messages_ticket_id ON ticket_messages(ticket_id);

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_ticket_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_ticket_updated_at ON tickets;
CREATE TRIGGER trigger_update_ticket_updated_at
  BEFORE UPDATE ON tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_ticket_updated_at();

-- Trigger pour mettre à jour le ticket quand un message est ajouté
CREATE OR REPLACE FUNCTION update_ticket_on_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE tickets SET updated_at = NOW() WHERE id = NEW.ticket_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_ticket_on_message ON ticket_messages;
CREATE TRIGGER trigger_update_ticket_on_message
  AFTER INSERT ON ticket_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_ticket_on_message();

-- RLS (Row Level Security)
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_messages ENABLE ROW LEVEL SECURITY;

-- Policies pour tickets - permettre toutes les opérations pour les utilisateurs authentifiés
DROP POLICY IF EXISTS "Users can view their own tickets" ON tickets;
CREATE POLICY "Users can view their own tickets" ON tickets
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can create tickets" ON tickets;
CREATE POLICY "Users can create tickets" ON tickets
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow update tickets" ON tickets;
CREATE POLICY "Allow update tickets" ON tickets
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Policies pour ticket_messages
DROP POLICY IF EXISTS "Users can view messages" ON ticket_messages;
CREATE POLICY "Users can view messages" ON ticket_messages
  FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can send messages" ON ticket_messages;
CREATE POLICY "Users can send messages" ON ticket_messages
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
