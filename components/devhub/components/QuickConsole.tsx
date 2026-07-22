import React, { useState } from "react";
import { saveDevItem } from "../store";
import { DevItem, DevItemType } from "../types";
import { Terminal, CornerDownLeft } from "lucide-react";
import { sileo } from "sileo";

interface QuickConsoleProps {
  onItemAdded: () => void;
}

export function QuickConsole({ onItemAdded }: QuickConsoleProps) {
  const [input, setInput] = useState("");

  const parseAndSave = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    let type: DevItemType = "note";
    let title = "";
    let description = "";
    let url = "";
    let content = "";
    let apiKey = "";
    let username = "";
    let password = "";
    let category = "General";

    // 1. Detect URLs
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
      url = trimmed;
      const urlObj = new URL(trimmed);

      // Fetch translated metadata from our API (title & description in Spanish)
      let metaTitle: string | null = null;
      let metaDesc: string | null = null;
      try {
        const metaRes = await fetch(`/api/metadata?url=${encodeURIComponent(trimmed)}`);
        if (metaRes.ok) {
          const metaData = await metaRes.json();
          metaTitle = metaData.title || null;
          metaDesc = metaData.description || null;
        }
      } catch (_) {}

      if (urlObj.hostname.includes("youtube.com") || urlObj.hostname.includes("youtu.be")) {
        type = "youtube";
        category = "Media";
        const videoId = urlObj.searchParams.get("v") || urlObj.pathname.split("/").pop();
        title = metaTitle || `Video de YouTube (${videoId || "Link"})`;
        description = metaDesc || "Video guardado para ver más tarde.";
      } else if (urlObj.hostname.includes("github.com")) {
        type = "repo";
        category = "Repositorios";
        const paths = urlObj.pathname.split("/").filter(Boolean);
        if (paths.length >= 2) {
          title = metaTitle || `${paths[0]}/${paths[1]}`;
          description = metaDesc || `Repositorio de GitHub por ${paths[0]}.`;
        } else {
          title = metaTitle || "Repositorio de GitHub";
          description = metaDesc || "Repositorio guardado.";
        }
      } else {
        type = "tool";
        category = "Herramientas";
        title = metaTitle || urlObj.hostname.replace("www.", "");
        description = metaDesc || "Herramienta web guardada.";
      }
    }
    // 2. Detect Credentials: "creds: url/service - user / pass"
    else if (trimmed.toLowerCase().startsWith("creds:") || trimmed.toLowerCase().startsWith("cred:")) {
      type = "credential";
      category = "Credenciales";
      const cleanInput = trimmed.replace(/^(creds:|cred:)\s*/i, "");
      const parts = cleanInput.split("-");
      title = parts[0]?.trim() || "Credencial Rápida";

      if (parts[1]) {
        const credParts = parts[1].split("/");
        username = credParts[0]?.trim() || "";
        password = credParts[1]?.trim() || "";
      }
      description = `Credenciales de acceso para ${title}.`;
    }
    // 3. Detect API Keys: "api: service - key" or "api: service - endpoint - key"
    else if (trimmed.toLowerCase().startsWith("api:")) {
      type = "api";
      category = "APIs";
      const cleanInput = trimmed.replace(/^api:\s*/i, "");
      const parts = cleanInput.split("-");

      if (parts.length >= 3) {
        title = parts[0]?.trim() || "API de Desarrollo";
        url = parts[1]?.trim() || "";
        apiKey = parts[2]?.trim() || "";
      } else {
        title = parts[0]?.trim() || "API de Desarrollo";
        apiKey = parts[1]?.trim() || "";
      }
      description = `Clave de API para el servicio ${title}.`;
    }
    // 4. Fallback to Note
    else {
      type = "note";
      category = "Notas";
      const lines = trimmed.split("\n");
      title = lines[0].substring(0, 50);
      if (lines.length > 1) {
        content = lines.slice(1).join("\n");
        description = "Nota rápida con contenido extendido.";
      } else {
        content = trimmed;
        description = "Nota de texto rápida.";
      }
    }

    try {
      saveDevItem({
        title,
        description,
        type,
        url: url || undefined,
        content: content || undefined,
        apiKey: apiKey || undefined,
        username: username || undefined,
        password: password || undefined,
        category,
      });

      const typeLabels: Record<DevItemType, string> = {
        tool: "Herramienta",
        repo: "Repositorio",
        youtube: "YouTube",
        note: "Nota",
        api: "Clave de API",
        credential: "Credencial",
      };

      sileo.success({
        title: "Recurso detectado y guardado",
        description: `[${typeLabels[type]}] "${title}" guardado de forma rápida.`,
      });

      setInput("");
      onItemAdded();
    } catch (e) {
      console.error(e);
      sileo.error({
        title: "Error al guardar",
        description: "No se pudo procesar el comando rápido de entrada.",
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      parseAndSave(input);
    }
  };

  return (
    <div className="relative border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4 rounded-none overflow-hidden flex flex-col gap-2">
      <div className="corner-square" />
      <div className="flex items-center gap-2 text-[#76b900] font-mono text-[10px] uppercase tracking-wider font-bold">
        <Terminal className="w-3.5 h-3.5" />
        <span>Consola de Entrada Rápida (Smart Parse)</span>
      </div>

      <div className="relative">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={2}
          placeholder="Escribe o pega aquí (URL de GitHub/YouTube/Web, 'creds: servicio - user/pass', 'api: servicio - api_key' o cualquier nota) y presiona Enter..."
          className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-none p-3 pl-3 pr-10 text-xs font-mono text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-[#76b900] transition-colors resize-none leading-relaxed"
        />
        <button
          onClick={() => parseAndSave(input)}
          className="absolute right-3.5 bottom-3.5 text-zinc-400 hover:text-[#76b900] transition-colors"
          title="Ejecutar y guardar"
        >
          <CornerDownLeft className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[10px] font-mono text-zinc-400 dark:text-zinc-500 pt-1 select-none border-t border-zinc-100 dark:border-zinc-900/60 mt-1">
        <div>
          <span className="text-[#76b900] font-bold">» Link Git:</span> github.com/user/repo
        </div>
        <div>
          <span className="text-[#76b900] font-bold">» Creds:</span> creds: host - user / pass
        </div>
        <div>
          <span className="text-[#76b900] font-bold">» API:</span> api: nombre - endpoint - key
        </div>
        <div>
          <span className="text-[#76b900] font-bold">» Notas:</span> Escribe cualquier texto libre
        </div>
      </div>
    </div>
  );
}