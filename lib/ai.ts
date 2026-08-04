export async function askAI(prompt: string, context: string): Promise<string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  }

  try {
    const { supabase } = await import("./supabase")
    if (supabase) {
      const { data } = await supabase.auth.getSession()
      const token = data.session?.access_token
      if (token) headers.Authorization = `Bearer ${token}`
    }
  } catch {
    /* continue without token */
  }

  const res = await fetch("/api/chat", {
    method: "POST",
    headers,
    body: JSON.stringify({ prompt, context }),
  })

  const data = await res.json()

  if (!res.ok) {
    const errorMsg = data?.error || `Error HTTP ${res.status}`
    console.error("AI Service Error:", res.status, errorMsg)
    throw new Error(errorMsg)
  }

  if (!data?.text) {
    throw new Error("El servicio de IA respondió vacío o en formato inesperado")
  }

  return data.text
}

/** @deprecated use askAI */
export const askGemini = askAI
