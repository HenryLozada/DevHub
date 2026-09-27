import React, { useState } from "react";
import {
  ExternalLink,
  Eye,
  EyeOff,
  Copy,
  Edit,
  Trash2,
  Lock,
  Key,
  FileText,
  Terminal,
} from "lucide-react";
import { FaGithub, FaYoutube } from "@/components/icons";
import { DevItem } from "../types";
import { openSecrets, type ItemSecrets } from "../security";
import { useVaultUnlock } from "./useVaultUnlock";
import { sileo } from "sileo";

interface ItemCardProps {
  item: DevItem;
  onEdit: (item: DevItem) => void;
  onDelete: (id: string) => void;
}

function getYouTubeId(url: string) {
  try {
    const urlObj = new URL(url);
    if (urlObj.hostname.includes("youtube.com")) {
      return urlObj.searchParams.get("v");
    }
    if (urlObj.hostname.includes("youtu.be")) {
      return urlObj.pathname.split("/").filter(Boolean)[0];
    }
  } catch (e) {
    return null;
  }
  return null;
}

export function ItemCard({ item, onEdit, onDelete }: ItemCardProps) {
  const [revealed, setRevealed] = useState(false);
  const [secrets, setSecrets] = useState<ItemSecrets | null>(null);
  const { requestUnlock, dialog } = useVaultUnlock();
  const hasApiKey = Boolean(item.apiKey || (item.type === "api" && item.secretEnc));
  const hasPassword = Boolean(item.password || (item.type === "credential" && item.secretEnc));

  const getSecrets = async (): Promise<ItemSecrets | null> => {
    if (!(await requestUnlock())) return null;
    try {
      return await openSecrets(item);
    } catch {
      sileo.error({ title: "No se pudo descifrar", description: "Desbloquea DevHub con tu PIN en este dispositivo." });
      return null;
    }
  };

  const revealPassword = async () => {
    if (revealed) {
      setRevealed(false);
      setSecrets(null);
      return;
    }
    const s = await getSecrets();
    if (s) {
      setSecrets(s);
      setRevealed(true);
    }
  };

  const copySecret = async (field: keyof ItemSecrets, label: string) => {
    const s = await getSecrets();
    if (s?.[field]) handleCopy(s[field]!, label);
  };

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    sileo.success({
      title: "Copiado",
      description: `${fieldName} copiado al portapapeles.`,
    });
  };

  const handleDelete = () => {
    if (window.confirm(`¿Estás seguro de que deseas eliminar "${item.title}"?`)) {
      onDelete(item.id);
    }
  };

  // Get type icon & color accent
  const getTypeMeta = () => {
    switch (item.type) {
      case "tool":
        return { icon: <Terminal className="w-4 h-4 text-brand" />, label: "Tool", color: "var(--color-brand)" };
      case "repo":
        return { icon: <FaGithub className="w-4 h-4 text-violet" />, label: "Repo", color: "var(--color-violet)" };
      case "youtube":
        return { icon: <FaYoutube className="w-4 h-4 text-neg" />, label: "YouTube", color: "var(--color-neg)" };
      case "note":
        return { icon: <FileText className="w-4 h-4 text-info" />, label: "Nota", color: "var(--color-info)" };
      case "api":
        return { icon: <Key className="w-4 h-4 text-warn" />, label: "API Key", color: "var(--color-warn)" };
      case "credential":
        return { icon: <Lock className="w-4 h-4 text-cyan" />, label: "Login", color: "var(--color-cyan)" };
      default:
        return { icon: <Terminal className="w-4 h-4 text-brand" />, label: "Otro", color: "var(--color-brand)" };
    }
  };

  const meta = getTypeMeta();
  const ytVideoId = item.type === "youtube" && item.url ? getYouTubeId(item.url) : null;

  return (
    <div className="panel reveal group flex min-h-[233px] flex-col justify-between p-f21 transition-colors">
      {/* Signature NVIDIA green corner square */}

      {/* Top Metadata Header */}
      <div>
        <div className="flex items-center justify-between">
          <span className="cal-chip select-none pl-f8 font-mono text-[10px] uppercase tracking-wider" style={{ "--neon": meta.color } as React.CSSProperties}>
            {item.category}
          </span>
          <div className="flex items-center gap-f5 text-zinc-500">
            {meta.icon}
            <span className="eyebrow select-none tracking-[0.2em]">{meta.label}</span>
     </div>
     {dialog}
     </div>

        {/* Title & Description */}
        <h4 className="mt-f13 line-clamp-1 text-base font-medium text-zinc-900 transition-colors dark:text-zinc-100">
          {item.title}
        </h4>
        {item.description && (
          <p className="mt-f5 line-clamp-2 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
            {item.description}
          </p>
        )}
      </div>

      {/* YouTube Thumbnail Preview */}
      {ytVideoId && (
        <div className="relative mt-f13 aspect-video w-full select-none overflow-hidden rounded-f13">
          <img
            src={`https://img.youtube.com/vi/${ytVideoId}/mqdefault.jpg`}
            alt={item.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
          <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors flex items-center justify-center">
            <div className="w-8 h-8 rounded-full bg-neg/90 text-white flex items-center justify-center shadow-md scale-95 group-hover:scale-100 transition-transform">
              <FaYoutube className="w-4 h-4 ml-0.5" />
            </div>
          </div>
        </div>
      )}

      {/* Type Specific Content rendering */}
      <div className="mt-f13 flex flex-1 flex-col justify-end">
        {/* Tool type URL */}
        {item.type === "tool" && item.url && (
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-brand hover:text-brand-hi font-bold hover:underline font-mono"
          >
            <ExternalLink className="w-3.5 h-3.5" /> Abrir Herramienta
          </a>
        )}

        {/* GitHub Repository URL */}
        {item.type === "repo" && item.url && (
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-zinc-700 dark:text-zinc-300 hover:text-black dark:hover:text-white font-bold hover:underline font-mono"
          >
            <FaGithub className="w-3.5 h-3.5" /> Ir a GitHub
          </a>
        )}

        {/* YouTube Video URL */}
        {item.type === "youtube" && item.url && (
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-neg hover:brightness-110 font-bold hover:underline font-mono"
          >
            <FaYoutube className="w-3.5 h-3.5" /> Ver en YouTube
          </a>
        )}

        {/* Note snippet */}
        {item.type === "note" && item.content && (
          <div className="relative rounded-f8 bg-zinc-900/[0.03] dark:bg-white/[0.03] border border-zinc-900/5 dark:border-white/[0.06] p-2 font-mono text-[10px] max-h-20 overflow-y-auto text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap select-all">
            <button
              onClick={() => handleCopy(item.content || "", "Nota")}
              className="absolute top-1 right-1 p-1 rounded-f5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors shadow-xs"
              title="Copiar nota"
            >
              <Copy className="w-3 h-3" />
            </button>
            {item.content}
          </div>
        )}

        {/* API Key */}
        {item.type === "api" && hasApiKey && (
          <div className="flex items-center gap-2">
            <div className="flex-1 rounded-f8 bg-zinc-900/[0.03] dark:bg-white/[0.03] border border-zinc-900/5 dark:border-white/[0.06] px-2 py-1 font-mono text-[11px] text-zinc-700 dark:text-zinc-300 overflow-hidden truncate">
              {revealed ? secrets?.apiKey : "••••••••••••••••"}
            </div>
            <button
              onClick={revealPassword}
              className="p-f5 rounded-f8 border border-zinc-200 dark:border-white/10 hover:bg-zinc-900/5 dark:hover:bg-white/5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
              title={revealed ? "Ocultar" : "Revelar"}
            >
              {revealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={() => void copySecret("apiKey", "API Key")}
              className="p-f5 rounded-f8 border border-zinc-200 dark:border-white/10 hover:bg-zinc-900/5 dark:hover:bg-white/5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
              title="Copiar"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Credentials */}
        {item.type === "credential" && (
          <div className="space-y-1.5 rounded-f8 bg-zinc-900/[0.03] dark:bg-white/[0.03] border border-zinc-900/5 dark:border-white/[0.06] p-2 text-zinc-700 dark:text-zinc-300 font-mono text-xs">
            {item.username && (
              <div className="flex items-center gap-1.5 overflow-hidden">
                <span className="font-bold text-zinc-400">U:</span>
                <span className="truncate flex-1 select-all">{item.username}</span>
                <button
                  onClick={() => handleCopy(item.username || "", "Usuario")}
                  className="p-0.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
                >
                  <Copy className="w-3 h-3" />
                </button>
              </div>
            )}
            {hasPassword && (
              <div className="flex items-center gap-1.5 overflow-hidden">
                <span className="font-bold text-zinc-400">P:</span>
                 <span className={`flex-1 truncate ${revealed ? "select-all" : "select-none"}`}>
                  {revealed ? secrets?.password : "••••••••"}
                </span>
                <button
                   onClick={revealPassword}
                  className="p-0.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
                >
                  {revealed ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                </button>
                <button
                   onClick={() => void copySecret("password", "Contraseña")}
                  className="p-0.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
                >
                  <Copy className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer controls: Edit/Delete */}
      <div className="mt-f13 flex items-center justify-between gap-f8 border-t border-zinc-900/5 pt-f13 text-zinc-400 dark:border-white/[0.06]">
        <span className="select-none font-mono text-[10px] text-zinc-400 dark:text-zinc-600">
          {item.createdAt ? new Date(item.createdAt).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" }) : ""}
        </span>
         <div className="flex items-center gap-2">
        <button
          onClick={() => onEdit(item)}
          className="p-1 hover:bg-zinc-50 dark:hover:bg-zinc-900 hover:text-black dark:hover:text-white transition-colors cursor-pointer"
          title="Editar"
        >
          <Edit className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={handleDelete}
          className="p-1 hover:bg-zinc-50 dark:hover:bg-zinc-900 hover:text-neg transition-colors cursor-pointer"
          title="Eliminar"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
    </div>
  );
}
