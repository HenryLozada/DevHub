import type { APIRoute } from "astro"
import { lookup } from "node:dns/promises"
import { isIP } from "node:net"
import { getSessionUser, isRateLimited, json } from "@/lib/server-auth"
import { isPrivateIp } from "@/lib/ip-safety"

export const prerender = false

const GROQ_API_KEY = import.meta.env.GROQ_API_KEY
const RATE_LIMIT = 20
const MAX_REDIRECTS = 3
const BLOCKED_HOSTS = new Set(["localhost", "metadata.google.internal"])

async function isSafeUrl(raw: string): Promise<{ ok: true; url: URL } | { ok: false; error: string }> {
  let parsed: URL
  try {
    parsed = new URL(raw)
  } catch {
    return { ok: false, error: "URL inválida" }
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { ok: false, error: "Solo se permiten URLs http(s)" }
  }

  const hostname = parsed.hostname.replace(/^\[|\]$/g, "").toLowerCase()
  if (BLOCKED_HOSTS.has(hostname) || hostname.endsWith(".local") || hostname.endsWith(".internal")) {
    return { ok: false, error: "Host no permitido" }
  }

  // Resolve DNS so names pointing at private addresses are rejected too
  let addresses: string[]
  try {
    addresses = isIP(hostname) ? [hostname] : (await lookup(hostname, { all: true })).map((r) => r.address)
  } catch {
    return { ok: false, error: "No se pudo resolver el host" }
  }
  if (addresses.length === 0 || addresses.some(isPrivateIp)) {
    return { ok: false, error: "Host no permitido" }
  }

  return { ok: true, url: parsed }
}

async function translateToSpanish(text: string): Promise<string> {
  if (!GROQ_API_KEY || !text || text.length > 1000) return text
  const spanishIndicators = /[áéíóúñ¿¡]/i
  if (spanishIndicators.test(text)) return text
  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content:
              "Traduce el siguiente texto a español mexicano. Responde UNICAMENTE con la traducción, sin explicaciones, sin comillas, sin notas adicionales. Si el texto ya está en español, repítelo tal cual.",
          },
          { role: "user", content: text },
        ],
        temperature: 0.1,
        max_tokens: 200,
      }),
    })
    if (!res.ok) return text
    const data = await res.json()
    return data?.choices?.[0]?.message?.content?.trim() || text
  } catch {
    return text
  }
}

export const GET: APIRoute = async ({ request, url }) => {
  const target = url.searchParams.get("url")
  if (!target) {
    return new Response(JSON.stringify({ error: "Missing url param" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    })
  }

  const user = await getSessionUser(request)
  if (!user) return json({ error: "No autorizado" }, 401)
  if (isRateLimited(`metadata:${user.id}`, RATE_LIMIT)) {
    return json({ error: "Demasiadas solicitudes. Intenta en un minuto." }, 429)
  }

  try {
    // Follow redirects manually so every hop is validated against private networks
    let current = target
    let res: Response | null = null
    for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
      const safe = await isSafeUrl(current)
      if (!safe.ok) return json({ error: safe.error }, 400)
      res = await fetch(safe.url.toString(), {
        signal: AbortSignal.timeout(8000),
        headers: { "User-Agent": "PersonalHub/1.0" },
        redirect: "manual",
      })
      const location = res.status >= 300 && res.status < 400 ? res.headers.get("location") : null
      if (!location) break
      current = new URL(location, safe.url).toString()
      res = null
    }
    if (!res) return json({ error: "Demasiadas redirecciones" }, 400)

    const html = (await res.text()).slice(0, 500_000)

    let title =
      extractMeta(html, [
        'property="og:title"',
        'name="twitter:title"',
        "property='og:title'",
        "name='twitter:title'",
      ]) || extractTag(html, "title")

    let description = extractMeta(html, [
      'property="og:description"',
      'name="description"',
      'name="twitter:description"',
      "property='og:description'",
      "name='description'",
      "name='twitter:description'",
    ])

    if (title) title = await translateToSpanish(title)
    if (description) description = await translateToSpanish(description)

    const siteName = extractMeta(html, ['property="og:site_name"', "property='og:site_name'"])
    const icon =
      extractAttr(html, 'rel="icon"', "href") ||
      extractAttr(html, "rel='icon'", "href") ||
      extractAttr(html, 'rel="shortcut icon"', "href")

    return new Response(JSON.stringify({ title, description, siteName, icon }), {
      headers: { "Content-Type": "application/json" },
    })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message || "Failed to fetch metadata" }), {
      status: 502,
      headers: { "Content-Type": "application/json" },
    })
  }
}

function extractMeta(html: string, patterns: string[]): string | null {
  for (const pattern of patterns) {
    const regex = new RegExp(`<meta\\s+[^>]*${pattern}[^>]*content=["']([^"']+)["']`, "i")
    const match = html.match(regex)
    if (match) return decodeEntities(match[1])
  }
  return null
}

function extractTag(html: string, tag: string): string | null {
  const match = html.match(new RegExp(`<${tag}[^>]*>([^<]+)</${tag}>`, "i"))
  return match ? decodeEntities(match[1].trim()) : null
}

function extractAttr(html: string, relPattern: string, attr: string): string | null {
  const regex = new RegExp(`<link\\s+[^>]*${relPattern}[^>]*${attr}=["']([^"']+)["']`, "i")
  const match = html.match(regex)
  return match ? match[1] : null
}

function decodeEntities(str: string): string {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, "/")
}

