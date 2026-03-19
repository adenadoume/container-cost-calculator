import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function sb() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v));
  if (req.method === 'OPTIONS') return res.status(204).end();

  const client = sb();
  if (!client) {
    return res.status(503).json({ error: 'Supabase not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.' });
  }

  // GET – list all snapshots (full data including calculator for loading)
  if (req.method === 'GET') {
    const { data, error } = await client
      .schema('container_cost')
      .from('snapshots')
      .select('id, name, created_at, container, calculator')
      .order('created_at', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    return res.json(data ?? []);
  }

  // POST – save new snapshot
  if (req.method === 'POST') {
    const { name, container, calculator } = req.body ?? {};
    if (!name || !container || !calculator) {
      return res.status(400).json({ error: 'name, container, calculator are required' });
    }
    const { data, error } = await client
      .schema('container_cost')
      .from('snapshots')
      .insert({ name, container, calculator })
      .select('id, name, created_at, container, calculator')
      .single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json(data);
  }

  // DELETE – delete by id (?id=xxx)
  if (req.method === 'DELETE') {
    const id = req.query.id as string;
    if (!id) return res.status(400).json({ error: 'id query param required' });
    const { error } = await client
      .schema('container_cost')
      .from('snapshots')
      .delete()
      .eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(204).end();
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
