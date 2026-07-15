import type { APIRoute } from "astro";

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const apiKey = import.meta.env.GROQ_API_KEY;

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "GROQ_API_KEY no está configurada en las variables de servidor" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const bodyData = await request.json();
    const { prompt, context } = bodyData || {};

    if (!prompt) {
      return new Response(
        JSON.stringify({ error: "El prompt es requerido" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const MODEL = "llama-3.3-70b-versatile";
    const url = "https://api.groq.com/openai/v1/chat/completions";

    const payload = {
      model: MODEL,
      messages: [
        { role: "system", content: context || "" },
        { role: "user", content: prompt },
      ],
    };

    const groqRes = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await groqRes.json();

    if (!groqRes.ok) {
      const errorMsg = data?.error?.message || "Error al comunicarse con la API de IA";
      return new Response(
        JSON.stringify({ error: errorMsg }),
        { status: groqRes.status, headers: { "Content-Type": "application/json" } }
      );
    }

    const text = data?.choices?.[0]?.message?.content;
    if (!text) {
      return new Response(
        JSON.stringify({ error: "Respuesta vacía del proveedor de IA" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ text }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err?.message || "Error interno del servidor" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
