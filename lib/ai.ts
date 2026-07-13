export async function askGemini(prompt: string, context: string): Promise<string> {
  const API_KEY = import.meta.env.PUBLIC_GROQ_API_KEY;

  if (!API_KEY) {
    throw new Error("PUBLIC_GROQ_API_KEY no está definida en .env");
  }

  if (!API_KEY.startsWith("gsk_")) {
    throw new Error("La key de Groq debe empezar con 'gsk_'");
  }

  const MODEL = "llama-3.3-70b-versatile";
  const url = "https://api.groq.com/openai/v1/chat/completions";

  const body = {
    model: MODEL,
    messages: [
      { role: "system", content: context },
      { role: "user", content: prompt },
    ],
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();

  if (!res.ok) {
    const detalles = data?.error?.message || JSON.stringify(data);
    console.error("Groq API error:", res.status, detalles);
    throw new Error(`Groq API error ${res.status}: ${detalles}`);
  }

  const text = data?.choices?.[0]?.message?.content;
  if (!text) {
    throw new Error("Groq respondió vacío o en un formato inesperado");
  }

  return text;
}
