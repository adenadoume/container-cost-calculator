-- Run this in your existing Supabase project (SQL Editor).
-- Uses a separate schema "container_cost" so it doesn't mix with your existing tables.
-- After running: Dashboard → Project Settings → API → Exposed schemas → add "container_cost".

CREATE SCHEMA IF NOT EXISTS container_cost;

GRANT USAGE ON SCHEMA container_cost TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA container_cost TO anon, authenticated, service_role;

CREATE TABLE IF NOT EXISTS container_cost.containers (
  id            TEXT PRIMARY KEY DEFAULT 'default',
  title         TEXT NOT NULL DEFAULT 'SUDU8701372',
  mbl           TEXT NOT NULL DEFAULT '255436388',
  container_code TEXT NOT NULL DEFAULT 'I110.15',
  ref_no        TEXT NOT NULL DEFAULT '12239',
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Seed default row
INSERT INTO container_cost.containers (id, title, mbl, container_code, ref_no)
VALUES ('default', 'SUDU8701372', '255436388', 'I110.15', '12239')
ON CONFLICT (id) DO NOTHING;

-- If table already exists without new columns, run:
-- ALTER TABLE container_cost.containers ADD COLUMN IF NOT EXISTS container_code TEXT NOT NULL DEFAULT 'I110.15';
-- ALTER TABLE container_cost.containers ADD COLUMN IF NOT EXISTS ref_no TEXT NOT NULL DEFAULT '12239';

-- Optional: enable if you use SUPABASE_ANON_KEY in Vercel (allows anon to read/write this table)
-- ALTER TABLE container_cost.containers ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Allow anon read/write" ON container_cost.containers
--   FOR ALL TO anon USING (true) WITH CHECK (true);
