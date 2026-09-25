// Server-only helpers for API routes: Supabase session validation and per-user rate limiting
import { createClient, type User } from "@supabase/supabase-js"

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY
const authClient = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false, autoRefreshToken: false } })
  : null

/** Returns the Supabase user for the request's Bearer token, or null if missing/invalid. */
export async function getSessionUser(request: Request): Promise<User | null> {
  if (!authClient) return null
  const header = request.headers.get("authorization") || ""
  const token = header.toLowerCase().startsWith("bearer ") ? header.slice(7).trim() : ""
  if (!token) return null
  const { data, error } = await authClient.auth.getUser(token)
  return error ? null : data.user
}

const rateMap = new Map<string, { count: number; resetAt: number }>()

/** In-memory fixed-window limiter (per serverless instance). */
export function isRateLimited(key: string, limit: number, windowMs = 60_000): boolean {
  const now = Date.now()
  const entry = rateMap.get(key)
  if (!entry || entry.resetAt < now) {
    rateMap.set(key, { count: 1, resetAt: now + windowMs })
    return false
  }
  entry.count += 1
  return entry.count > limit
}

export function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  })
}
