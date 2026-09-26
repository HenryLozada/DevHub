// Daily "heartbeat" so the free Supabase project isn't paused for inactivity (see vercel.json cron)
import { createClient, type SupabaseClient } from "@supabase/supabase-js"
import { json } from "./server-auth"

interface Deps {
  client: Pick<SupabaseClient, "from"> | null
  /** When set, requests must carry `Authorization: Bearer <secret>` (Vercel Cron sends it) */
  secret?: string
}

export async function handleKeepalive(request: Request, { client, secret }: Deps): Promise<Response> {
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return json({ ok: false, error: "No autorizado" }, 401)
  }
  if (!client) return json({ ok: false, error: "Supabase no configurado" }, 500)

  // A real query reaching Postgres is what counts as activity; RLS makes it return no rows
  const { error } = await client.from("cashflow_rules").select("user_id").limit(1)
  if (error) return json({ ok: false, error: error.message }, 500)
  return json({ ok: true, at: new Date().toISOString() })
}

export function defaultKeepaliveDeps(): Deps {
  const url = import.meta.env.PUBLIC_SUPABASE_URL
  const key = import.meta.env.PUBLIC_SUPABASE_ANON_KEY
  return {
    client: url && key ? createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } }) : null,
    // Read at runtime so the secret can be set in Vercel without being inlined at build time
    secret: process.env.CRON_SECRET || undefined,
  }
}
