/**
 * Local dev API only. On Vercel, /api/* is served by serverless functions.
 * Uses Supabase (same as production). Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.
 */
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';

const app = express();
app.use(cors());
app.use(express.json());

const CONTAINER_ID = 'default';
const defaults = { title: 'SUDU8701372', mbl: '255436388', container_code: 'I110.15', ref_no: '12239' };

function supabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

app.get('/api/container', async (req, res) => {
  const sb = supabase();
  if (!sb) return res.json(defaults);
  try {
    const { data, error } = await sb.schema('container_cost').from('containers').select('title, mbl, container_code, ref_no').eq('id', CONTAINER_ID).maybeSingle();
    if (error) throw error;
    return res.json({
      title: data?.title ?? defaults.title,
      mbl: data?.mbl ?? defaults.mbl,
      container_code: data?.container_code ?? defaults.container_code,
      ref_no: data?.ref_no ?? defaults.ref_no,
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Database error' });
  }
});

app.patch('/api/container', async (req, res) => {
  const sb = supabase();
  const title = req.body?.title ?? defaults.title;
  const mbl = req.body?.mbl ?? defaults.mbl;
  const container_code = req.body?.container_code ?? defaults.container_code;
  const ref_no = req.body?.ref_no ?? defaults.ref_no;
  if (!sb) return res.json({ title, mbl, container_code, ref_no });
  try {
    const { error } = await sb.schema('container_cost').from('containers').upsert(
      { id: CONTAINER_ID, title, mbl, container_code, ref_no, updated_at: new Date().toISOString() },
      { onConflict: 'id' }
    );
    if (error) throw error;
    return res.json({ title, mbl, container_code, ref_no });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Database error' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`API running at http://localhost:${PORT} (use /api/container)`);
});
