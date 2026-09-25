import type { APIRoute } from "astro"
import { createClient } from "@supabase/supabase-js"

export const prerender = false

const rateMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT = 30
const RATE_WINDOW_MS = 60_000
const MAX_BODY_CHARS = 80_000

function getClientIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  )
}

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const entry = rateMap.get(ip)
  if (!entry || entry.resetAt < now) {
    rateMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS })
    return false
  }
  entry.count += 1
  return entry.count > RATE_LIMIT
}

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY
const authClient = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false, autoRefreshToken: false } })
  : null

async function isValidSession(token: string): Promise<boolean> {
  if (!authClient) return false
  const { data, error } = await authClient.auth.getUser(token)
  return !error && !!data.user
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  })
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const ip = getClientIp(request)
    if (isRateLimited(ip)) {
      return json({ error: "Demasiadas solicitudes. Intenta en un minuto." }, 429)
    }

    const apiKey = import.meta.env.GROQ_API_KEY
    if (!apiKey) {
      return json({ error: "GROQ_API_KEY no está configurada en las variables de servidor" }, 500)
    }

    // Require a valid Supabase session: the app only calls this endpoint when logged in
    const authHeader = request.headers.get("authorization") || ""
    const token = authHeader.toLowerCase().startsWith("bearer ") ? authHeader.slice(7).trim() : ""
    if (!token || !(await isValidSession(token))) {
      return json({ error: "No autorizado" }, 401)
    }

    const raw = await request.text()
    if (raw.length > MAX_BODY_CHARS) {
      return json({ error: "Payload demasiado grande" }, 413)
    }

    let bodyData: { prompt?: string; context?: string }
    try {
      bodyData = JSON.parse(raw)
    } catch {
      return json({ error: "JSON inválido" }, 400)
    }

    const { prompt, context } = bodyData || {}
    if (!prompt || typeof prompt !== "string") {
      return json({ error: "El prompt es requerido" }, 400)
    }

    const safeContext =
      typeof context === "string" ? context.slice(0, 40_000) : ""

    const MODEL = "llama-3.3-70b-versatile"
    const url = "https://api.groq.com/openai/v1/chat/completions"

    const payload = {
      model: MODEL,
      messages: [
        { role: "system", content: safeContext || "" },
        { role: "user", content: prompt.slice(0, 8_000) },
      ],
      max_tokens: 2048,
    }

    const groqRes = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })

    const data = await groqRes.json()

    if (!groqRes.ok) {
      const errorMsg = data?.error?.message || "Error al comunicarse con la API de IA"
      return json({ error: errorMsg }, groqRes.status)
    }

    const text = data?.choices?.[0]?.message?.content
    if (!text) {
      return json({ error: "Respuesta vacía del proveedor de IA" }, 500)
    }

    return json({ text })
  } catch (err: any) {
    return json({ error: err?.message || "Error interno del servidor" }, 500)
  }
}
