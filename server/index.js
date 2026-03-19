/**
 * Local dev API only. On Vercel, /api/* is served by serverless functions.
 * Uses Supabase when .env is set; otherwise persists to server/.local-state.json.
 */
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOCAL_STATE_PATH = path.join(__dirname, '.local-state.json');

function readLocalState() {
  try {
    const raw = fs.readFileSync(LOCAL_STATE_PATH, 'utf8');
    const data = JSON.parse(raw);
    return { container: data.container || null, calculator: data.calculator || null, snapshots: data.snapshots || [] };
  } catch {
    return { container: null, calculator: null, snapshots: [] };
  }
}

function writeLocalState(partial) {
  const prev = readLocalState();
  const next = {
    container:  partial.container  !== undefined ? partial.container  : prev.container,
    calculator: partial.calculator !== undefined ? partial.calculator : prev.calculator,
    snapshots:  partial.snapshots  !== undefined ? partial.snapshots  : prev.snapshots,
  };
  fs.writeFileSync(LOCAL_STATE_PATH, JSON.stringify(next, null, 2), 'utf8');
}

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

// Ensure all errors return JSON (avoids empty or HTML response)
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Server error', details: err?.message || String(err) });
});

const CONTAINER_ID = 'default';
const defaults = { title: 'SUDU8701372', mbl: '255436388', container_code: 'I110.15', ref_no: '12239' };

function supabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

/** Wrap async route so unhandled rejections return JSON instead of empty response */
function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res)).catch(err => {
    console.error(err);
    res.status(500).json({ error: 'Server error', details: err?.message || String(err) });
  });
}

app.get('/api/container', asyncHandler(async (req, res) => {
  const sb = supabase();
  if (!sb) {
    const local = readLocalState().container;
    return res.json(local ? { title: local.title ?? defaults.title, mbl: local.mbl ?? defaults.mbl, container_code: local.container_code ?? defaults.container_code, ref_no: local.ref_no ?? defaults.ref_no } : defaults);
  }
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
    return res.status(500).json({ error: 'Database error', details: e?.message });
  }
}));

app.patch('/api/container', asyncHandler(async (req, res) => {
  const sb = supabase();
  const body = req.body || {};
  if (!sb) {
    const local = readLocalState().container;
    const merged = {
      title: body.title !== undefined ? body.title : (local?.title ?? defaults.title),
      mbl: body.mbl !== undefined ? body.mbl : (local?.mbl ?? defaults.mbl),
      container_code: body.container_code !== undefined ? body.container_code : (local?.container_code ?? defaults.container_code),
      ref_no: body.ref_no !== undefined ? body.ref_no : (local?.ref_no ?? defaults.ref_no),
    };
    writeLocalState({ container: merged });
    return res.json(merged);
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
    return res.status(500).json({ error: 'Database error', details: e?.message });
  }
}));

const CALC_ID = 'default';
const calcDefaults = {
  global_rate: 1.1651,
  rate_date: new Date().toISOString().slice(0, 10),
  total_goods_usd: 53870.46,
  goods_currency: 'USD',
  goods_rate: 1.1651,
  sample_price: 100,
  groups: [],
};

app.get('/api/calculator', asyncHandler(async (req, res) => {
  const sb = supabase();
  if (!sb) {
    const local = readLocalState().calculator;
    if (!local) return res.json(calcDefaults);
    return res.json({
      global_rate: local.global_rate ?? calcDefaults.global_rate,
      rate_date: local.rate_date ?? calcDefaults.rate_date,
      total_goods_usd: local.total_goods_usd ?? calcDefaults.total_goods_usd,
      goods_rate: local.goods_rate ?? calcDefaults.goods_rate,
      sample_price: local.sample_price ?? calcDefaults.sample_price,
      groups: Array.isArray(local.groups) ? local.groups : calcDefaults.groups,
    });
  }
  try {
    const { data, error } = await sb.schema('container_cost').from('calculator_state').select('global_rate, rate_date, total_goods_usd, goods_currency, goods_rate, sample_price, groups').eq('id', CALC_ID).maybeSingle();
    if (error) throw error;
    if (!data) return res.json(calcDefaults);
    return res.json({
      global_rate: data.global_rate ?? calcDefaults.global_rate,
      rate_date: data.rate_date ?? calcDefaults.rate_date,
      total_goods_usd: data.total_goods_usd ?? calcDefaults.total_goods_usd,
      goods_currency: data.goods_currency === 'EUR' ? 'EUR' : 'USD',
      goods_rate: data.goods_rate ?? calcDefaults.goods_rate,
      sample_price: data.sample_price ?? calcDefaults.sample_price,
      groups: Array.isArray(data.groups) ? data.groups : calcDefaults.groups,
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Database error', details: e?.message });
  }
}));

app.patch('/api/calculator', asyncHandler(async (req, res) => {
  const body = req.body || {};
  const payload = {
    id: CALC_ID,
    global_rate: Number(body.global_rate) ?? calcDefaults.global_rate,
    rate_date: body.rate_date ?? calcDefaults.rate_date,
    total_goods_usd: Number(body.total_goods_usd) ?? calcDefaults.total_goods_usd,
    goods_currency: body.goods_currency === 'EUR' ? 'EUR' : 'USD',
    goods_rate: Number(body.goods_rate) ?? calcDefaults.goods_rate,
    sample_price: Number(body.sample_price) ?? calcDefaults.sample_price,
    groups: Array.isArray(body.groups) ? body.groups : calcDefaults.groups,
    updated_at: new Date().toISOString(),
  };
  const sb = supabase();
  if (!sb) {
    writeLocalState({ calculator: payload });
    return res.json(payload);
  }
  try {
    const { error } = await sb.schema('container_cost').from('calculator_state').upsert(payload, { onConflict: 'id' });
    if (error) throw error;
    return res.json(payload);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Database error', details: e?.message });
  }
}));

// ── SNAPSHOTS ─────────────────────────────────────────────────────────────────

app.get('/api/snapshots', asyncHandler(async (req, res) => {
  const sb = supabase();
  if (!sb) {
    const snaps = readLocalState().snapshots;
    return res.json([...snaps].reverse());
  }
  const { data, error } = await sb.schema('container_cost').from('snapshots')
    .select('id, name, created_at, container, calculator')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return res.json(data ?? []);
}));

app.post('/api/snapshots', asyncHandler(async (req, res) => {
  const { name, container, calculator } = req.body ?? {};
  if (!name || !container || !calculator) {
    return res.status(400).json({ error: 'name, container, calculator are required' });
  }
  const sb = supabase();
  if (!sb) {
    const prev = readLocalState().snapshots;
    const entry = { id: Math.random().toString(36).slice(2, 11), name, container, calculator, created_at: new Date().toISOString() };
    writeLocalState({ snapshots: [...prev, entry] });
    return res.status(201).json(entry);
  }
  const { data, error } = await sb.schema('container_cost').from('snapshots')
    .insert({ name, container, calculator })
    .select('id, name, created_at, container, calculator')
    .single();
  if (error) throw error;
  return res.status(201).json(data);
}));

app.delete('/api/snapshots', asyncHandler(async (req, res) => {
  const id = req.query.id;
  if (!id) return res.status(400).json({ error: 'id query param required' });
  const sb = supabase();
  if (!sb) {
    const prev = readLocalState().snapshots;
    writeLocalState({ snapshots: prev.filter(s => s.id !== id) });
    return res.status(204).end();
  }
  const { error } = await sb.schema('container_cost').from('snapshots').delete().eq('id', id);
  if (error) throw error;
  return res.status(204).end();
}));

app.get('/api/health', (req, res) => {
  const hasUrl = process.env.SUPABASE_URL?.length > 10;
  const hasKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY)?.length > 20;
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.json({
    ok: true,
    supabase: hasUrl && hasKey,
    hint: !hasUrl || !hasKey ? 'Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env' : 'If saves fail: run supabase/schema.sql and add container_cost to Supabase → Settings → API → Exposed schemas.',
  });
});

// 404 for unknown routes – return JSON so client never gets empty/non-JSON body
app.use((req, res) => {
  res.status(404).json({ error: 'Not found', path: req.path });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`API running at http://localhost:${PORT} (use /api/container, /api/calculator, /api/health)`);
});
