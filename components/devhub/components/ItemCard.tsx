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
        return { icon: <Terminal className="w-4 h-4 text-[#76b900]" />, label: "Tool" };
      case "repo":
        return { icon: <FaGithub className="w-4 h-4 text-zinc-900 dark:text-white" />, label: "Repo" };
      case "youtube":
        return { icon: <FaYoutube className="w-4 h-4 text-red-600" />, label: "YouTube" };
      case "note":
        return { icon: <FileText className="w-4 h-4 text-blue-500" />, label: "Nota" };
      case "api":
        return { icon: <Key className="w-4 h-4 text-amber-500" />, label: "API Key" };
      case "credential":
        return { icon: <Lock className="w-4 h-4 text-indigo-500" />, label: "Login" };
      default:
        return { icon: <Terminal className="w-4 h-4 text-[#76b900]" />, label: "Otro" };
    }
  };

  const meta = getTypeMeta();
  const ytVideoId = item.type === "youtube" && item.url ? getYouTubeId(item.url) : null;

  return (
    <div className="relative flex flex-col justify-between border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-5 rounded-none shadow-sm min-h-[220px] group overflow-hidden transition-all">
      {/* Signature NVIDIA green corner square */}
      <div className="corner-square" />

      {/* Top Metadata Header */}
      <div>
        <div className="flex items-center justify-between">
          <span className="text-[9px] font-mono font-bold tracking-wider uppercase bg-zinc-100 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 px-2 py-0.5 border border-zinc-200 dark:border-zinc-800 select-none">
            {item.category}
          </span>
          <div className="flex items-center gap-1 text-xs font-mono font-semibold text-zinc-400">
            {meta.icon}
            <span className="text-[10px] uppercase select-none">{meta.label}</span>
          </div>
        </div>

        {/* Title & Description */}
        <h4 className="text-base font-bold font-sans text-zinc-900 dark:text-white mt-3 group-hover:text-[#76b900] transition-colors line-clamp-1">
          {item.title}
        </h4>
        {item.description && (
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
            {item.description}
          </p>
        )}
      </div>

      {/* YouTube Thumbnail Preview */}
      {ytVideoId && (
        <div className="mt-3 relative aspect-[16/9] w-full overflow-hidden border border-zinc-200 dark:border-zinc-800 select-none">
          <img
            src={`https://img.youtube.com/vi/${ytVideoId}/mqdefault.jpg`}
            alt={item.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
          <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors flex items-center justify-center">
            <div className="w-8 h-8 rounded-full bg-red-600/90 text-white flex items-center justify-center shadow-md scale-95 group-hover:scale-100 transition-transform">
              <FaYoutube className="w-4 h-4 ml-0.5" />
            </div>
          </div>
        </div>
      )}

      {/* Type Specific Content rendering */}
      <div className="mt-4 flex-1 flex flex-col justify-end">
        {/* Tool type URL */}
        {item.type === "tool" && item.url && (
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-[#76b900] hover:text-[#86cb10] font-bold hover:underline font-mono"
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
            className="flex items-center gap-1.5 text-xs text-red-600 dark:text-red-500 hover:text-red-700 dark:hover:text-red-400 font-bold hover:underline font-mono"
          >
            <FaYoutube className="w-3.5 h-3.5" /> Ver en YouTube
          </a>
        )}

        {/* Note snippet */}
        {item.type === "note" && item.content && (
          <div className="relative bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 p-2 font-mono text-[10px] max-h-20 overflow-y-auto text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap select-all">
            <button
              onClick={() => handleCopy(item.content || "", "Nota")}
              className="absolute top-1 right-1 p-1 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors shadow-xs"
              title="Copiar nota"
            >
              <Copy className="w-3 h-3" />
            </button>
            {item.content}
          </div>
        )}

        {/* API Key */}
        {item.type === "api" && item.apiKey && (
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 px-2 py-1 font-mono text-[11px] text-zinc-700 dark:text-zinc-300 overflow-hidden truncate">
              {revealed ? item.apiKey : "••••••••••••••••"}
            </div>
            <button
              onClick={() => setRevealed(!revealed)}
              className="p-1.5 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
              title={revealed ? "Ocultar" : "Revelar"}
            >
              {revealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={() => handleCopy(item.apiKey || "", "API Key")}
              className="p-1.5 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
              title="Copiar"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Credentials */}
        {item.type === "credential" && (
          <div className="space-y-1.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 p-2 text-zinc-700 dark:text-zinc-300 font-mono text-xs">
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
            {item.password && (
              <div className="flex items-center gap-1.5 overflow-hidden">
                <span className="font-bold text-zinc-400">P:</span>
                <span className="flex-1 truncate select-all">
                  {revealed ? item.password : "••••••••"}
                </span>
                <button
                  onClick={() => setRevealed(!revealed)}
                  className="p-0.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
                >
                  {revealed ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                </button>
                <button
                  onClick={() => handleCopy(item.password || "", "Contraseña")}
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
      <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-900/60 flex items-center justify-between gap-2 text-zinc-400">
        <span className="text-[9px] font-mono text-zinc-300 dark:text-zinc-700 select-none">
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
          className="p-1 hover:bg-zinc-50 dark:hover:bg-zinc-900 hover:text-red-600 transition-colors cursor-pointer"
          title="Eliminar"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
    </div>
  );
}
