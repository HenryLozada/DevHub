import type { APIRoute } from "astro"
import { getSessionUser, isRateLimited, json } from "@/lib/server-auth"

export const prerender = false

const RATE_LIMIT = 30
const MAX_BODY_CHARS = 80_000

export const POST: APIRoute = async ({ request }) => {
  try {
    const apiKey = import.meta.env.GROQ_API_KEY
    if (!apiKey) {
      return json({ error: "GROQ_API_KEY no está configurada en las variables de servidor" }, 500)
    }

    const user = await getSessionUser(request)
    if (!user) {
      return json({ error: "No autorizado" }, 401)
    }
    if (isRateLimited(`chat:${user.id}`, RATE_LIMIT)) {
      return json({ error: "Demasiadas solicitudes. Intenta en un minuto." }, 429)
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
