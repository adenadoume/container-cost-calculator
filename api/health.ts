import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * GET /api/health — Check if Supabase env vars are set (no secrets returned).
 * If you get supabase: false, add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in Vercel.
 * If you get supabase: true but saves still fail, run schema in Supabase and add "container_cost" to Exposed schemas.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  const hasUrl = typeof url === 'string' && url.length > 10;
  const hasKey = typeof key === 'string' && key.length > 20;
  res.setHeader('Access-Control-Allow-Origin', '*');
  return res.status(200).json({
    ok: true,
    supabase: hasUrl && hasKey,
    hint: !hasUrl || !hasKey
      ? 'Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in Vercel → Project → Settings → Environment Variables, then redeploy.'
      : 'If saves still fail: run supabase/schema.sql in Supabase SQL Editor and add "container_cost" to Project Settings → API → Exposed schemas.',
  });
}
