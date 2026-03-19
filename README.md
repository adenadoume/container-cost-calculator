# Container Cost Calculator

React app for landed cost calculation with **editable container title** and **MBL**, persisted in your **existing Supabase** (separate schema). Deploy to **Vercel** with one click.

## Features

- **Editable container title & MBL** — click the pencil to edit; values are saved to Supabase (`container_cost` schema).
- **Landed cost calculator** — cost groups (Unitex, SBA, Customs, Transport), per-group USD/EUR rate, toggle items in/out, multiplier hero with one-click copy.
- **Rate date** — optional date for USD conversion (placeholder for future: fetch exchange rate for that specific date).
- **Dark theme** — MONOREPO-style UI and animations.

## Supabase (existing project)

1. In your Supabase project, open **SQL Editor** and run the script in **`supabase/schema.sql`**.
2. In **Project Settings → API**, add **`container_cost`** to **Exposed schemas**.
3. Copy **Project URL** and one key: **service_role** (recommended) or **anon** (see env vars below).

## Local run

1. **Connect to Supabase:** Edit **`.env`** in the project root and set:
   - **`SUPABASE_URL`** = your project URL (e.g. `https://xxxxx.supabase.co`)
   - **`SUPABASE_SERVICE_ROLE_KEY`** = your service_role key  
   Both are in Supabase → **Project Settings → API**.

2. **Install and run:**
```bash
npm install
npm run dev
```

- Frontend: http://localhost:5173  
- API: http://localhost:3001 (reads from `.env`; same Supabase as Vercel)

**Important:** `npm run dev` starts both the Vite dev server and the API server. You should see `API running at http://localhost:3001`. If Supabase env vars are missing or wrong, saves will fail and the app will show a red “Save failed” banner with instructions.

## Deploy to Vercel

1. Push this repo to GitHub (e.g. [adenadoume/container-cost-calculator](https://github.com/adenadoume/container-cost-calculator)).
2. In [Vercel](https://vercel.com), **Import** the repo.
3. **Add environment variables** (required for saves to work):
   - **Project → Settings → Environment Variables**
   - `SUPABASE_URL` = your Supabase project URL (e.g. `https://xxxxx.supabase.co`)
   - `SUPABASE_SERVICE_ROLE_KEY` = your **service_role** key (from Supabase → Project Settings → API)
4. Deploy. The API runs as serverless functions under `/api/*`. If you deploy without these variables, the app will load but saves will show “Save failed” with instructions to add them and redeploy.

## Push to GitHub (replace existing repo)

```bash
cd container-cost-calculator
git init
git add .
git commit -m "Container cost calculator: React, Supabase, Vercel"
git remote add origin https://github.com/adenadoume/container-cost-calculator.git
git branch -M main
git push -u origin main --force
```

Use `--force` only if you intend to replace the remote history (e.g. empty repo or full replace).

## Tech stack

- **Frontend:** React 18, TypeScript, Vite, Tailwind, Lucide React.
- **API:** Vercel serverless (`api/container.ts`) + optional Express for local dev.
- **Database:** Supabase (Postgres), schema **`container_cost`**, table **`containers`**.

## Schema

See **`supabase/schema.sql`**:

- **`container_cost.containers`** — container header: `id`, `title`, `mbl`, `container_code`, `ref_no`, timestamps.
- **`container_cost.calculator_state`** — full calculator: `id`, `global_rate`, `rate_date`, `total_goods_usd`, `goods_rate`, `sample_price`, `groups` (JSONB), `updated_at`. All cost groups, items, and values are saved here; changes (including add/delete cost lines) persist and sync across sessions.
