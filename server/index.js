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
  const body = req.body || {};
  if (!sb) {
    return res.json({
      title: body.title ?? defaults.title,
      mbl: body.mbl ?? defaults.mbl,
      container_code: body.container_code ?? defaults.container_code,
      ref_no: body.ref_no ?? defaults.ref_no,
    });
  }
  try {
    const { data: current } = await sb.schema('container_cost').from('containers').select('title, mbl, container_code, ref_no').eq('id', CONTAINER_ID).maybeSingle();
    const merged = {
      id: CONTAINER_ID,
      title: body.title !== undefined ? body.title : (current?.title ?? defaults.title),
      mbl: body.mbl !== undefined ? body.mbl : (current?.mbl ?? defaults.mbl),
      container_code: body.container_code !== undefined ? body.container_code : (current?.container_code ?? defaults.container_code),
      ref_no: body.ref_no !== undefined ? body.ref_no : (current?.ref_no ?? defaults.ref_no),
      updated_at: new Date().toISOString(),
    };
    const { error } = await sb.schema('container_cost').from('containers').upsert(merged, { onConflict: 'id' });
    if (error) throw error;
    return res.json({ title: merged.title, mbl: merged.mbl, container_code: merged.container_code, ref_no: merged.ref_no });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Database error' });
  }
});

const CALC_ID = 'default';
const calcDefaults = {
  global_rate: 1.1651,
  rate_date: new Date().toISOString().slice(0, 10),
  total_goods_usd: 53870.46,
  goods_rate: 1.1651,
  sample_price: 100,
  groups: [],
};

app.get('/api/calculator', async (req, res) => {
  const sb = supabase();
  if (!sb) return res.json(calcDefaults);
  try {
    const { data, error } = await sb.schema('container_cost').from('calculator_state').select('global_rate, rate_date, total_goods_usd, goods_rate, sample_price, groups').eq('id', CALC_ID).maybeSingle();
    if (error) throw error;
    if (!data) return res.json(calcDefaults);
    return res.json({
      global_rate: data.global_rate ?? calcDefaults.global_rate,
      rate_date: data.rate_date ?? calcDefaults.rate_date,
      total_goods_usd: data.total_goods_usd ?? calcDefaults.total_goods_usd,
      goods_rate: data.goods_rate ?? calcDefaults.goods_rate,
      sample_price: data.sample_price ?? calcDefaults.sample_price,
      groups: Array.isArray(data.groups) ? data.groups : calcDefaults.groups,
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Database error' });
  }
});

app.patch('/api/calculator', async (req, res) => {
  const body = req.body || {};
  const payload = {
    id: CALC_ID,
    global_rate: Number(body.global_rate) ?? calcDefaults.global_rate,
    rate_date: body.rate_date ?? calcDefaults.rate_date,
    total_goods_usd: Number(body.total_goods_usd) ?? calcDefaults.total_goods_usd,
    goods_rate: Number(body.goods_rate) ?? calcDefaults.goods_rate,
    sample_price: Number(body.sample_price) ?? calcDefaults.sample_price,
    groups: Array.isArray(body.groups) ? body.groups : calcDefaults.groups,
    updated_at: new Date().toISOString(),
  };
  const sb = supabase();
  if (!sb) return res.json(payload);
  try {
    const { error } = await sb.schema('container_cost').from('calculator_state').upsert(payload, { onConflict: 'id' });
    if (error) throw error;
    return res.json(payload);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Database error' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`API running at http://localhost:${PORT} (use /api/container, /api/calculator)`);
});
