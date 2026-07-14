import React, { useState, useEffect, type FormEvent } from "react";
import { motion } from "motion/react";
import { X } from "lucide-react";
import { DevItem, DevItemType } from "../types";
import { saveDevItem, updateDevItem } from "../store";
import { sileo } from "sileo";

interface ItemModalProps {
  item?: DevItem | null;
  onClose: () => void;
  onSaved: () => void;
}

const CATEGORIES = ["General", "Frontend", "Backend", "DevOps", "AI", "Mobile", "Testing", "Database"];

export function ItemModal({ item, onClose, onSaved }: ItemModalProps) {
  const [title, setTitle] = useState(item?.title ?? "");
  const [description, setDescription] = useState(item?.description ?? "");
  const [type, setType] = useState<DevItemType>(item?.type ?? "tool");
  const [category, setCategory] = useState(item?.category ?? "General");
  const [url, setUrl] = useState(item?.url ?? "");
  const [content, setContent] = useState(item?.content ?? "");
  const [apiKey, setApiKey] = useState(item?.apiKey ?? "");
  const [username, setUsername] = useState(item?.username ?? "");
  const [password, setPassword] = useState(item?.password ?? "");

  // Keydown listener for Escape key to close the modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // Standard Validation
    if (!title.trim() && type !== "youtube") {
      sileo.error({ title: "Error de validación", description: "El título es obligatorio." });
      return;
    }

    if (["tool", "repo", "youtube"].includes(type) && !url.trim()) {
      sileo.error({ title: "Error de validación", description: "La URL es obligatoria para este tipo de elemento." });
      return;
    }

    let finalTitle = title.trim();
    let finalDescription = description.trim();

    // Si es tipo YouTube y no tiene título ingresado por el usuario, buscar el real
    if (type === "youtube" && url.trim()) {
      if (!finalTitle || finalTitle.toLowerCase() === "video de youtube" || finalTitle.startsWith("video de youtube (")) {
        const urlObj = new URL(url.trim());
        const videoId = urlObj.searchParams.get("v") || urlObj.pathname.split("/").pop();
        finalTitle = `Video de YouTube (${videoId || "Link"})`;
        
        try {
          const res = await fetch(`https://noembed.com/embed?url=${encodeURIComponent(url.trim())}`);
          if (res.ok) {
            const data = await res.json();
            if (data && data.title) {
              finalTitle = data.title;
              if (!finalDescription) {
                finalDescription = `Canal: ${data.author_name || "Desconocido"}. Video de YouTube guardado.`;
              }
            }
          }
        } catch (err) {
          console.warn("Failed to fetch YouTube metadata in modal", err);
        }
      }
    }

    // Prepare payload
    const payload = {
      title: finalTitle,
      description: finalDescription || undefined,
      type,
      category,
      url: ["tool", "repo", "youtube"].includes(type) ? url.trim() : undefined,
      content: type === "note" ? content.trim() : undefined,
      apiKey: type === "api" ? apiKey.trim() : undefined,
      username: type === "credential" ? username.trim() : undefined,
      password: type === "credential" ? password.trim() : undefined,
    };

    try {
      if (item) {
        updateDevItem(item.id, payload);
        sileo.success({ title: "Elemento actualizado", description: `"${payload.title}" guardado correctamente.` });
      } else {
        saveDevItem(payload);
        sileo.success({ title: "Elemento creado", description: `"${payload.title}" agregado al DevHub.` });
      }
      onSaved();
      onClose();
    } catch (err) {
      sileo.error({ title: "Error", description: "Ocurrió un error al guardar el elemento." });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/50 backdrop-blur-xs"
        onClick={onClose}
      />

      {/* Modal Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative w-full max-w-lg bg-[#ffffff] dark:bg-[#121212] border border-zinc-200 dark:border-zinc-800 rounded-none shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Signature NVIDIA green corner square */}
        <div className="corner-square" />

        {/* Black Header */}
        <div className="bg-black text-white px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between border-b border-zinc-800 select-none">
          <h3 className="text-sm font-mono font-bold tracking-wider uppercase text-zinc-100 flex items-center gap-2">
            <span className="text-[#76b900]">//</span> {item ? "Editar Elemento" : "Nuevo Elemento"}
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors focus:outline-none"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-[10px] font-mono font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-1.5">
              Título / Nombre
            </label>
            <input
              autoFocus
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="ej. GitHub Copilot, Servidor de Producción..."
              className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-none text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:border-[#76b900] font-sans text-sm transition-colors"
            />
          </div>

          {/* Type & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-mono font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-1.5">
                Tipo de Item
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as DevItemType)}
                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-none text-zinc-900 dark:text-white text-sm focus:outline-none focus:border-[#76b900] transition-colors"
              >
                <option value="tool">Herramienta (Tool)</option>
                <option value="repo">Repositorio (GitHub)</option>
                <option value="youtube">Video / Canal (YouTube)</option>
                <option value="note">Nota / Snippet</option>
                <option value="api">Clave API (API Key)</option>
                <option value="credential">Credenciales (Logins)</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-mono font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-1.5">
                Categoría
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-none text-zinc-900 dark:text-white text-sm focus:outline-none focus:border-[#76b900] transition-colors"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-[10px] font-mono font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-1.5">
              Descripción (opcional)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalles sobre este recurso..."
              className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-none text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:border-[#76b900] text-sm resize-none transition-colors"
            />
          </div>

          {/* Dynamic fields based on type */}
          {["tool", "repo", "youtube"].includes(type) && (
            <div>
              <label className="block text-[10px] font-mono font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-1.5">
                Enlace / URL
              </label>
              <input
                type="url"
                required
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-none text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:border-[#76b900] font-sans text-sm transition-colors"
              />
            </div>
          )}

          {type === "note" && (
            <div>
              <label className="block text-[10px] font-mono font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-1.5">
                Contenido / Nota
              </label>
              <textarea
                rows={6}
                required
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Escribe tu código, snippet o apuntes aquí..."
                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-none text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:border-[#76b900] font-mono text-xs resize-y transition-colors"
              />
            </div>
          )}

          {type === "api" && (
            <div>
              <label className="block text-[10px] font-mono font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-1.5">
                Clave API (API Key)
              </label>
              <input
                type="text"
                required
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-proj-..."
                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-none text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:border-[#76b900] font-mono text-sm transition-colors"
              />
            </div>
          )}

          {type === "credential" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-mono font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-1.5">
                  Usuario / Email
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin, email@host.com"
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-none text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:border-[#76b900] text-sm transition-colors"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-1.5">
                  Contraseña
                </label>
                <input
                  type="text"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-none text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:border-[#76b900] text-sm transition-colors"
                />
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-4 flex items-center justify-end gap-2 border-t border-zinc-100 dark:border-zinc-800/60">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 text-zinc-700 dark:text-zinc-300 font-bold font-mono text-xs uppercase tracking-wider transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-black hover:bg-zinc-900 dark:bg-[#76b900] dark:hover:bg-[#86cb10] text-white dark:text-black font-bold font-mono text-xs uppercase tracking-wider border border-transparent dark:border-transparent transition-colors cursor-pointer"
            >
              {item ? "Guardar" : "Crear"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
