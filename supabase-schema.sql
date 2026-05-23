-- ============================================
-- GreenLedTech Chat System - Supabase Schema
-- ============================================
-- Run this SQL in your Supabase SQL Editor
-- ============================================

-- 1. Customers table
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT,
  name TEXT NOT NULL DEFAULT 'Visitor',
  last_locale TEXT NOT NULL DEFAULT 'en',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(email)
);

-- 2. Agents (customer service)
CREATE TABLE agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  avatar_url TEXT,
  is_online BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Chat sessions
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  assigned_agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Messages
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('customer', 'agent', 'system')),
  sender_id UUID, -- agent.id or customer.id
  text TEXT,
  image_url TEXT,
  sender_locale TEXT NOT NULL DEFAULT 'en',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Translations (stored per message per locale)
CREATE TABLE message_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  locale TEXT NOT NULL,
  translated_text TEXT NOT NULL,
  UNIQUE(message_id, locale)
);

-- ============================================
-- Indexes
-- ============================================
CREATE INDEX idx_sessions_customer ON sessions(customer_id);
CREATE INDEX idx_sessions_agent ON sessions(assigned_agent_id);
CREATE INDEX idx_sessions_status ON sessions(status);
CREATE INDEX idx_messages_session ON messages(session_id);
CREATE INDEX idx_messages_created ON messages(created_at);
CREATE INDEX idx_translations_message ON message_translations(message_id);

-- ============================================
-- Row Level Security
-- ============================================
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Agents can read all sessions assigned to them
CREATE POLICY "agents_read_own_sessions" ON sessions
  FOR SELECT USING (
    assigned_agent_id = auth.uid()
    OR assigned_agent_id IS NULL
  );

-- Agents can read messages of their sessions
CREATE POLICY "agents_read_session_messages" ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM sessions
      WHERE sessions.id = messages.session_id
      AND (sessions.assigned_agent_id = auth.uid() OR sessions.assigned_agent_id IS NULL)
    )
  );

-- Anyone can create a customer (for anonymous chat)
CREATE POLICY "anyone_can_insert_customer" ON customers
  FOR INSERT WITH CHECK (true);

