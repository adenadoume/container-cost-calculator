import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const CONTAINER_ID = 'default';
const supabaseUrl = process.env.SUPABASE_URL!;
// Use either: service_role (no RLS) or anon (requires RLS policy on container_cost.containers)
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

function supabase() {
  if (!supabaseUrl || !supabaseKey) return null;
  return createClient(supabaseUrl, supabaseKey);
}

const defaults = {
  title: 'SUDU8701372',
  mbl: '255436388',
  container_code: 'I110.15',
  ref_no: '12239',
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const sb = supabase();
  const table = () => sb!.schema('container_cost').from('containers');

  if (req.method === 'GET') {
    if (!sb) return res.status(200).json(defaults);
    const { data, error } = await table()
      .select('title, mbl, container_code, ref_no')
      .eq('id', CONTAINER_ID)
      .maybeSingle();
    if (error) {
      console.error(error);
      return res.status(500).json({ error: 'Database error' });
    }
    return res.status(200).json({
      title: data?.title ?? defaults.title,
      mbl: data?.mbl ?? defaults.mbl,
      container_code: data?.container_code ?? defaults.container_code,
      ref_no: data?.ref_no ?? defaults.ref_no,
    });
  }

  if (req.method === 'PATCH') {
    const body = req.body || {};
    if (!sb) {
      return res.status(200).json({
        title: body.title ?? defaults.title,
        mbl: body.mbl ?? defaults.mbl,
        container_code: body.container_code ?? defaults.container_code,
        ref_no: body.ref_no ?? defaults.ref_no,
      });
    }
    // Merge with current row so we only update sent fields
    const { data: current } = await table().select('title, mbl, container_code, ref_no').eq('id', CONTAINER_ID).maybeSingle();
    const merged = {
      id: CONTAINER_ID,
      title: body.title !== undefined ? body.title : (current?.title ?? defaults.title),
      mbl: body.mbl !== undefined ? body.mbl : (current?.mbl ?? defaults.mbl),
      container_code: body.container_code !== undefined ? body.container_code : (current?.container_code ?? defaults.container_code),
      ref_no: body.ref_no !== undefined ? body.ref_no : (current?.ref_no ?? defaults.ref_no),
      updated_at: new Date().toISOString(),
    };
    const { error } = await table().upsert(merged, { onConflict: 'id' });
    if (error) {
      console.error(error);
      return res.status(500).json({ error: 'Database error', details: error.message });
    }
    return res.status(200).json({
      title: merged.title,
      mbl: merged.mbl,
      container_code: merged.container_code,
      ref_no: merged.ref_no,
    });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
