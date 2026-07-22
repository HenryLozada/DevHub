import type { APIRoute } from "astro"

export const prerender = false

const GROQ_API_KEY = import.meta.env.GROQ_API_KEY

async function translateToSpanish(text: string): Promise<string> {
  if (!GROQ_API_KEY || !text || text.length > 1000) return text
  // Skip if text is already clearly in Spanish
  const spanishIndicators = /[áéíóúñ¿¡]/i
  if (spanishIndicators.test(text)) return text
  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: "Traduce el siguiente texto a español mexicano. Responde UNICAMENTE con la traducción, sin explicaciones, sin comillas, sin notas adicionales. Si el texto ya está en español, repítelo tal cual." },
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

export const GET: APIRoute = async ({ url }) => {
  const target = url.searchParams.get("url")
  if (!target) {
    return new Response(JSON.stringify({ error: "Missing url param" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    })
  }

  try {
    const res = await fetch(target, {
      signal: AbortSignal.timeout(8000),
      headers: { "User-Agent": "PersonalHub/1.0" },
    })
    const html = await res.text()

    let title = extractMeta(html, [
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

    const siteName = extractMeta(html, [
      'property="og:site_name"',
      "property='og:site_name'",
    ])
    const icon = extractAttr(html, 'rel="icon"', "href")
      || extractAttr(html, "rel='icon'", "href")
      || extractAttr(html, 'rel="shortcut icon"', "href")

    return new Response(
      JSON.stringify({ title, description, siteName, icon }),
      { headers: { "Content-Type": "application/json" } }
    )
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err?.message || "Failed to fetch metadata" }),
      { status: 502, headers: { "Content-Type": "application/json" } }
    )
  }
}

function extractMeta(html: string, patterns: string[]): string | null {
  for (const pattern of patterns) {
    const regex = new RegExp(
      `<meta\\s+[^>]*${pattern}[^>]*content=["']([^"']+)["']`,
      "i"
    )
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
  const regex = new RegExp(
    `<link\\s+[^>]*${relPattern}[^>]*${attr}=["']([^"']+)["']`,
    "i"
  )
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
