import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "motion/react"
import { Terminal, Bot, User, CornerDownLeft, Sparkles } from "lucide-react"
import { saveDevItem } from "../store"
import { DevItem, DevItemType } from "../types"
import { sileo } from "sileo"
import { cn } from "@/lib/utils"

interface DevBotChatProps {
  onItemAdded: () => void
}

interface Message {
  role: "user" | "bot"
  content: string
  timestamp: Date
  type?: string
}

const GLASS = "backdrop-blur-xl bg-white/40 dark:bg-zinc-950/40 border border-white/30 dark:border-white/10 shadow-sm shadow-black/5"
const GLASS_BOT = "backdrop-blur-md bg-white/60 dark:bg-zinc-950/60 border border-white/40 dark:border-white/[0.08] shadow-sm shadow-black/5"

function formatTime(d: Date) {
  return d.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })
}

function BotMessage({ msg, isFirst }: { msg: Message; isFirst: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="flex items-start gap-2.5 max-w-[85%]"
    >
      <div className="shrink-0 w-7 h-7 rounded-sm bg-[#76b900]/10 border border-[#76b900]/20 flex items-center justify-center mt-0.5">
        <Bot className="w-3.5 h-3.5 text-[#76b900]" />
      </div>
      <div>
        <div className={cn("px-3.5 py-2.5 text-xs leading-relaxed text-zinc-700 dark:text-zinc-300", GLASS_BOT, "rounded-sm")}>
          <p>{msg.content}</p>
        </div>
        <p className="text-[9px] font-mono text-zinc-400 dark:text-zinc-600 mt-1 px-1">{formatTime(msg.timestamp)}</p>
      </div>
    </motion.div>
  )
}

function UserMessage({ msg }: { msg: Message }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="flex items-start gap-2.5 max-w-[85%] ml-auto flex-row-reverse"
    >
      <div className="shrink-0 w-7 h-7 rounded-sm bg-zinc-200/60 dark:bg-zinc-800/60 border border-white/30 dark:border-white/10 flex items-center justify-center mt-0.5 backdrop-blur-sm">
        <User className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
      </div>
      <div>
        <div className="px-3.5 py-2.5 text-xs leading-relaxed text-zinc-800 dark:text-zinc-200 bg-black/5 dark:bg-white/5 backdrop-blur-md border border-white/40 dark:border-white/[0.08] rounded-sm shadow-sm">
          <p>{msg.content}</p>
        </div>
        <p className="text-[9px] font-mono text-zinc-400 dark:text-zinc-600 mt-1 px-1 text-right">{formatTime(msg.timestamp)}</p>
      </div>
    </motion.div>
  )
}

export function DevBotChat({ onItemAdded }: DevBotChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "bot",
      content: "¡Hey! Pega cualquier link (GitHub, YouTube, web), o escribe credenciales, APIs o notas. Yo lo detecto y guardo automáticamente.",
      timestamp: new Date(),
      type: "welcome",
    },
  ])
  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isTyping])

  function addMessage(msg: Message) {
    setMessages(prev => [...prev, msg])
  }

  const parseAndSave = async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed) return

    addMessage({ role: "user", content: trimmed, timestamp: new Date() })
    setInput("")
    setIsTyping(true)

    let type: DevItemType = "note"
    let title = ""
    let description = ""
    let url = ""
    let content = ""
    let apiKey = ""
    let username = ""
    let password = ""
    let category = "General"

    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
      url = trimmed
      const urlObj = new URL(trimmed)

      // Fetch translated metadata from our API (title & description in Spanish)
      let metaTitle: string | null = null
      let metaDesc: string | null = null
      try {
        const metaRes = await fetch(`/api/metadata?url=${encodeURIComponent(trimmed)}`)
        if (metaRes.ok) {
          const metaData = await metaRes.json()
          metaTitle = metaData.title || null
          metaDesc = metaData.description || null
        }
      } catch (_) {}

      if (urlObj.hostname.includes("youtube.com") || urlObj.hostname.includes("youtu.be")) {
        type = "youtube"
        category = "Media"
        const videoId = urlObj.searchParams.get("v") || urlObj.pathname.split("/").pop()
        title = metaTitle || `Video de YouTube (${videoId || "Link"})`
        description = metaDesc || "Video guardado para ver más tarde."
      } else if (urlObj.hostname.includes("github.com")) {
        type = "repo"
        category = "Repositorios"
        const paths = urlObj.pathname.split("/").filter(Boolean)
        if (paths.length >= 2) {
          title = metaTitle || `${paths[0]}/${paths[1]}`
          description = metaDesc || `Repositorio de GitHub por ${paths[0]}.`
        } else {
          title = metaTitle || "Repositorio de GitHub"
          description = metaDesc || "Repositorio guardado."
        }
      } else {
        type = "tool"
        category = "Herramientas"
        title = metaTitle || urlObj.hostname.replace("www.", "")
        description = metaDesc || "Herramienta web guardada."
      }
    } else if (trimmed.toLowerCase().startsWith("creds:") || trimmed.toLowerCase().startsWith("cred:")) {
      type = "credential"
      category = "Credenciales"
      const cleanInput = trimmed.replace(/^(creds:|cred:)\s*/i, "")
      const parts = cleanInput.split("-")
      title = parts[0]?.trim() || "Credencial Rápida"
      if (parts[1]) {
        const credParts = parts[1].split("/")
        username = credParts[0]?.trim() || ""
        password = credParts[1]?.trim() || ""
      }
      description = `Credenciales de acceso para ${title}.`
    } else if (trimmed.toLowerCase().startsWith("api:")) {
      type = "api"
      category = "APIs"
      const cleanInput = trimmed.replace(/^api:\s*/i, "")
      const parts = cleanInput.split("-")
      if (parts.length >= 3) {
        title = parts[0]?.trim() || "API"
        url = parts[1]?.trim() || ""
        apiKey = parts[2]?.trim() || ""
      } else {
        title = parts[0]?.trim() || "API"
        apiKey = parts[1]?.trim() || ""
      }
      description = `Clave de API para ${title}.`
    } else {
      type = "note"
      category = "Notas"
      const lines = trimmed.split("\n")
      title = lines[0].substring(0, 50)
      if (lines.length > 1) {
        content = lines.slice(1).join("\n")
        description = "Nota rápida con contenido."
      } else {
        content = trimmed
        description = "Nota de texto rápida."
      }
    }

    const typeLabels: Record<DevItemType, { label: string; icon: string }> = {
      tool: { label: "Herramienta", icon: "🔧" },
      repo: { label: "Repositorio", icon: "📦" },
      youtube: { label: "Video", icon: "🎬" },
      note: { label: "Nota", icon: "📝" },
      api: { label: "API Key", icon: "🔑" },
      credential: { label: "Credencial", icon: "🔒" },
    }

    await new Promise(r => setTimeout(r, 400 + Math.random() * 600))

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
      })
      onItemAdded()
      sileo.success({
        title: "Recurso guardado",
        description: `${typeLabels[type].label}: ${title}`,
      })
      const info = typeLabels[type]
      addMessage({
        role: "bot",
        content: `${info.icon} **${info.label}** guardada — *${title}*`,
        timestamp: new Date(),
        type,
      })
    } catch {
      addMessage({
        role: "bot",
        content: "⚠️ Ocurrió un error al guardar. Intenta de nuevo.",
        timestamp: new Date(),
        type: "error",
      })
    }
    setIsTyping(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      parseAndSave(input)
    }
  }

  return (
    <div className={cn("rounded-sm overflow-hidden flex flex-col", GLASS)}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/30 dark:border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-sm bg-[#76b900]/10 border border-[#76b900]/20 flex items-center justify-center relative">
            <Terminal className="w-4 h-4 text-[#76b900]" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-[#76b900] rounded-full animate-pulse" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-zinc-800 dark:text-zinc-200 font-mono uppercase tracking-wider">DevBot</h3>
            <p className="text-[9px] font-mono text-zinc-400 dark:text-zinc-500">Smart Parse • Online</p>
          </div>
        </div>
        <div className="flex items-center gap-1 px-2 py-1 bg-[#76b900]/5 border border-[#76b900]/10 rounded-sm">
          <Sparkles className="w-3 h-3 text-[#76b900]" />
          <span className="text-[8px] font-mono font-bold text-[#76b900] uppercase tracking-wider">IA</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[280px] max-h-[420px] scrollbar-thin">
        <AnimatePresence>
          {messages.map((msg, i) =>
            msg.role === "bot" ? (
              <BotMessage key={i} msg={msg} isFirst={i === 0} />
            ) : (
              <UserMessage key={i} msg={msg} />
            )
          )}
        </AnimatePresence>

        {isTyping && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-2.5 max-w-[70%]"
          >
            <div className="shrink-0 w-7 h-7 rounded-sm bg-[#76b900]/10 border border-[#76b900]/20 flex items-center justify-center">
              <Bot className="w-3.5 h-3.5 text-[#76b900]" />
            </div>
            <div className={cn("px-3.5 py-3 flex items-center gap-1", GLASS_BOT, "rounded-sm")}>
              <span className="w-1.5 h-1.5 rounded-full bg-[#76b900] animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-1.5 h-1.5 rounded-full bg-[#76b900] animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-1.5 h-1.5 rounded-full bg-[#76b900] animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </motion.div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-white/30 dark:border-white/10 p-3">
        <div className="relative">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            placeholder="Pega un link, creds:, api:, o escribe una nota..."
            className="w-full bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm border border-white/40 dark:border-white/10 rounded-sm px-3 py-2.5 pr-10 text-xs font-mono text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-[#76b900] transition-colors resize-none leading-relaxed"
          />
          <button
            onClick={() => parseAndSave(input)}
            disabled={!input.trim() || isTyping}
            className="absolute right-2 bottom-2 p-1.5 text-zinc-400 hover:text-[#76b900] disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            <CornerDownLeft className="w-4 h-4" />
          </button>
        </div>
        <div className="flex gap-3 mt-2 text-[8px] font-mono text-zinc-400 dark:text-zinc-600 select-none">
          <span><span className="text-[#76b900]">github.com/</span>user/repo</span>
          <span><span className="text-[#76b900]">creds:</span> host - user / pass</span>
          <span><span className="text-[#76b900]">api:</span> nombre - endpoint - key</span>
        </div>
      </div>
    </div>
  )
}
