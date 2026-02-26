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

```bash
cp .env.example .env
# Set SUPABASE_URL and either SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY in .env
npm install
npm run dev
```

- Frontend: http://localhost:5173  
- API: http://localhost:3001 (Express, same Supabase — used only when not on Vercel)

Without Supabase env vars, the app runs; container title/MBL use in-memory defaults.

## Deploy to Vercel

1. Push this repo to GitHub (e.g. [adenadoume/container-cost-calculator](https://github.com/adenadoume/container-cost-calculator)).
2. In [Vercel](https://vercel.com), **Import** the repo.
3. Add environment variables:
   - `SUPABASE_URL` = your Supabase project URL  
   - Either **`SUPABASE_SERVICE_ROLE_KEY`** (service_role key — no RLS) or **`SUPABASE_ANON_KEY`** (anon key — run the optional RLS policy in `supabase/schema.sql` if you use anon)  
4. Deploy. The **API** is served as serverless functions under `/api/*` (e.g. `/api/container`).

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

See **`supabase/schema.sql`**. Table `container_cost.containers`: `id`, `title`, `mbl`, `created_at`, `updated_at`.
