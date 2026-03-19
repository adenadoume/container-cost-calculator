import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const CALC_ID = 'default';
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

function supabase() {
  if (!supabaseUrl || !supabaseKey) return null;
  return createClient(supabaseUrl, supabaseKey);
}

const defaultState = {
  global_rate: 1.1651,
  rate_date: new Date().toISOString().slice(0, 10),
  total_goods_usd: 53870.46,
  goods_rate: 1.1651,
  sample_price: 100,
  groups: [] as unknown[],
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const sb = supabase();
  const table = () => sb!.schema('container_cost').from('calculator_state');

  if (req.method === 'GET') {
    if (!sb) return res.status(200).json(defaultState);
    const { data, error } = await table()
      .select('global_rate, rate_date, total_goods_usd, goods_rate, sample_price, groups')
      .eq('id', CALC_ID)
      .maybeSingle();
    if (error) {
      console.error(error);
      return res.status(500).json({ error: 'Database error' });
    }
    if (!data) return res.status(200).json(defaultState);
    return res.status(200).json({
      global_rate: data.global_rate ?? defaultState.global_rate,
      rate_date: data.rate_date ?? defaultState.rate_date,
      total_goods_usd: data.total_goods_usd ?? defaultState.total_goods_usd,
      goods_rate: data.goods_rate ?? defaultState.goods_rate,
      sample_price: data.sample_price ?? defaultState.sample_price,
      groups: Array.isArray(data.groups) ? data.groups : defaultState.groups,
    });
  }

  if (req.method === 'PATCH') {
    const body = req.body || {};
    const global_rate = Number(body.global_rate) ?? defaultState.global_rate;
    const rate_date = body.rate_date ?? defaultState.rate_date;
    const total_goods_usd = Number(body.total_goods_usd) ?? defaultState.total_goods_usd;
    const goods_rate = Number(body.goods_rate) ?? defaultState.goods_rate;
    const sample_price = Number(body.sample_price) ?? defaultState.sample_price;
    const groups = Array.isArray(body.groups) ? body.groups : defaultState.groups;

    if (!sb) {
      return res.status(503).json({
        error: 'Supabase not configured',
        details: 'Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in Vercel → Project → Settings → Environment Variables, then redeploy.',
      });
    }
    const { error } = await table().upsert(
      {
        id: CALC_ID,
        global_rate,
        rate_date,
        total_goods_usd,
        goods_rate,
        sample_price,
        groups,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    );
    if (error) {
      console.error(error);
      return res.status(500).json({ error: 'Database error', details: error.message });
    }
    return res.status(200).json({
      global_rate,
      rate_date,
      total_goods_usd,
      goods_rate,
      sample_price,
      groups,
    });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
