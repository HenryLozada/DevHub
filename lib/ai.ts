export async function askGemini(prompt: string, context: string): Promise<string> {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ prompt, context }),
  });

  const data = await res.json();

  if (!res.ok) {
    const errorMsg = data?.error || `Error HTTP ${res.status}`;
    console.error("AI Service Error:", res.status, errorMsg);
    throw new Error(errorMsg);
  }

  if (!data?.text) {
    throw new Error("El servicio de IA respondió vacío o en formato inesperado");
  }

  return data.text;
}
