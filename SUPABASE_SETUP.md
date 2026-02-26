# Supabase setup (required for saving)

If nothing saves, follow these steps in order.

## 1. Run the schema

1. Open [Supabase Dashboard](https://supabase.com/dashboard) → your project.
2. Go to **SQL Editor**.
3. Copy the full contents of **`supabase/schema.sql`** from this repo and run it.
4. You should see "Success" and the tables `container_cost.containers` and `container_cost.calculator_state` will exist.

## 2. Expose the schema (most common fix)

By default only the `public` schema is exposed. This app uses the `container_cost` schema, so you must expose it:

1. In Supabase: **Project Settings** (gear icon) → **API**.
2. Find **Exposed schemas** (or "Schema" / "API settings").
3. Add **`container_cost`** to the list (comma-separated if needed, e.g. `public, container_cost`).
4. Save.

Without this step, GET/PATCH to the API will get permission/relation errors and nothing will save.

## 3. Vercel environment variables

In Vercel → your project → **Settings** → **Environment Variables**:

- **SUPABASE_URL** = `https://YOUR_PROJECT_REF.supabase.co` (no trailing slash).
- **SUPABASE_SERVICE_ROLE_KEY** = your project’s **service_role** secret key (Settings → API in Supabase).

No spaces before/after the values. Redeploy after changing env vars.

## 4. Check from the app

- Open your deployed app, try editing the container title and save.
- If it still doesn’t save, open DevTools (F12) → **Network** tab, trigger a save, and click the **container** or **calculator** request. Check the response body for an error message (e.g. "relation ... does not exist" or "permission denied").
- You can also open **`https://YOUR_VERCEL_URL/api/health`** in a browser. It will show whether Supabase env vars are set and a short hint.

## Security note

If you ever pasted your **SUPABASE_SERVICE_ROLE_KEY** in a chat or public place, rotate it: Supabase → **Project Settings** → **API** → regenerate the `service_role` key, then update the value in Vercel and redeploy.
