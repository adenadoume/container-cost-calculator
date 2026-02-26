-- Run this in your existing Supabase project (SQL Editor).
-- Uses a separate schema "container_cost" so it doesn't mix with your existing tables.
-- After running: Dashboard → Project Settings → API → Exposed schemas → add "container_cost".

CREATE SCHEMA IF NOT EXISTS container_cost;

GRANT USAGE ON SCHEMA container_cost TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA container_cost TO anon, authenticated, service_role;

CREATE TABLE IF NOT EXISTS container_cost.containers (
  id         TEXT PRIMARY KEY DEFAULT 'default',
  title      TEXT NOT NULL DEFAULT 'SUDU8701372',
  mbl        TEXT NOT NULL DEFAULT '255436388',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed default row
INSERT INTO container_cost.containers (id, title, mbl)
VALUES ('default', 'SUDU8701372', '255436388')
ON CONFLICT (id) DO NOTHING;
