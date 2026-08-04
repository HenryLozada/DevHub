import { useEffect, useState, useRef } from "react"
import { motion, AnimatePresence } from "motion/react"
import { X, Bot, Trash2, Camera } from "lucide-react"
import { cn } from "@/lib/utils"
import { ChatMessage } from "../types"
import { getChatHistory, addChatMessage, clearChatHistory } from "../store"
import { MessageBubble } from "./MessageBubble"
import { ChatInput } from "./ChatInput"
import { askAI } from "@/lib/ai"
import { parseActions } from "../actions"
import { getAvatar, setAvatar } from "@/lib/avatar"

interface ChatPanelProps {
  isOpen: boolean
  onClose: () => void
}

const GLASS = "backdrop-blur-xl bg-white/40 dark:bg-zinc-950/40 border border-white/30 dark:border-white/10 shadow-sm shadow-black/5"
const GLASS_INNER = "backdrop-blur-md bg-white/60 dark:bg-zinc-950/60 border border-white/40 dark:border-white/[0.08]"

const SUGGESTIONS = [
  { icon: "\u{1F4CA}", text: "Analiza mis finanzas del mes" },
  { icon: "\u{1F4C5}", text: "Que eventos tengo esta semana" },
  { icon: "\u2705", text: "Que tareas me faltan por hacer" },
  { icon: "\u{1F4DD}", text: "Agrega una nota rapida sobre una idea que tuve" },
  { icon: "\u{1F527}", text: "Recomiendame una herramienta de desarrollo" },
  { icon: "\u{1F4B0}", text: "Cuanto he gastado esta semana" },
  { icon: "\u{1F3AF}", text: "Sugiere cual es la prioridad del dia" },
  { icon: "\u{1F4E6}", text: "Guarda este repo: https://github.com/vercel/next.js" },
  { icon: "\u{1F3AC}", text: "Guarda este video de YouTube" },
  { icon: "\u{1F511}", text: "Guarda una API key de OpenAI" },
  { icon: "\u{1F512}", text: "Guarda una credencial de servidor" },
  { icon: "\u{1F4CB}", text: "Haz un resumen de todos mis datos" },
  { icon: "\u{1F4A1}", text: "Dame ideas de proyectos personales" },
  { icon: "\u{1F9F9}", text: "Sugiere que tareas del hogar hacer hoy" },
  { icon: "\u{1F4C8}", text: "Como puedo mejorar mis finanzas" },
  { icon: "\u26A1", text: "Que puedo automatizar en mi dia a dia" },
  { icon: "\u{1F3A8}", text: "Dame ideas de temas de color para mi dashboard" },
  { icon: "\u{1F4DA}", text: "Recomiendame recursos para aprender desarrollo" },
  { icon: "\u{1F3E0}", text: "Crea una tarea: Limpiar el garaje, para este sabado" },
  { icon: "\u{1F34E}", text: "Crea una tarea: Hacer ejercicio, diaria" },
  { icon: "\u{1F6D2}", text: "Agrega un gasto de 350 en Comida del supermercado" },
  { icon: "\u{1F381}", text: "Registra un ingreso de 5000 por freelance" },
  { icon: "\u{1F9E0}", text: "Que aprendi hoy - sugerencia para nota" },
  { icon: "\u{1F3B5}", text: "Guarda este canal de YouTube como recurso" },
  { icon: "\u{1F4F1}", text: "Sugiere apps de productividad" },
  { icon: "\u{1F319}", text: "Haz una rutina nocturna de tareas" },
  { icon: "\u2600\uFE0F", text: "Haz una rutina matutina" },
  { icon: "\u{1F510}", text: "Revisa si tengo APIs guardadas" },
  { icon: "\u{1F4CA}", text: "Compara gastos de esta semana vs la anterior" },
  { icon: "\u{1F389}", text: "Recomiendame algo nuevo para probar este fin de semana" },
]

function pickSuggestions(count = 5) {
  const copy = SUGGESTIONS.slice()
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const tmp = copy[i]
    copy[i] = copy[j]
    copy[j] = tmp
  }
  return copy.slice(0, count)
}

export function ChatPanel({ isOpen, onClose }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [suggestions] = useState(() => pickSuggestions(5))
  const [avatar, setAvatarState] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setAvatarState(getAvatar())
  }, [isOpen])

  function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = function() {
      const dataUrl = reader.result as string
      setAvatar(dataUrl)
      setAvatarState(dataUrl)
    }
    reader.readAsDataURL(file)
  }

  useEffect(() => {
    if (isOpen) setMessages(getChatHistory())
  }, [isOpen])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, loading])

  const handleSend = async (text: string) => {
    const userMsg = addChatMessage({ role: "user", text })
    setMessages(prev => [...prev, userMsg])
    setLoading(true)

    try {
      const rulesRaw = localStorage.getItem("cashflow_rules") || "[]"
      const eventsRaw = localStorage.getItem("personal_events_v2") || "[]"
      const choresRaw = localStorage.getItem("ph_chores_chores") || "[]"
      const expensesRaw = localStorage.getItem("ph_budgeted_expenses") || "[]"
      let devItemsSafe = "[]"
      try {
        const items = JSON.parse(localStorage.getItem("ph_devhub_items") || "[]")
        devItemsSafe = JSON.stringify(
          (Array.isArray(items) ? items : []).map((item: Record<string, unknown>) => ({
            id: item.id,
            title: item.title,
            type: item.type,
            url: item.url,
            category: item.category,
            description: item.description,
            hasCredential: Boolean(item.password || item.username),
            hasApiKey: Boolean(item.apiKey),
          }))
        )
      } catch {
        devItemsSafe = "[]"
      }

      const systemPrompt = `Eres DevBot, el copiloto de PersonalHub. Eres directo, proactivo, tecnico. Hablas espanol mexicano. INSTRUCCION ESTRICTA: SIEMPRE respondes en espanol.

ARQUITECTURA: Astro+React+Tailwind. Persistencia localStorage + Supabase. NUNCA pidas ni inventes contraseñas o API keys.

MODULOS:
1. FLUJO DE CAJA (cashflow_rules): {id, concepto, monto, tipo:"ingreso"|"egreso", recurrencia:"mensual"|"semanal", diaDelMes?, diaSemana?}
2. EVENTOS (personal_events_v2): {id, nombre, categoria, recurrencia, fechaUnica?, horaInicio?, horaFin?, nota?}
3. TAREAS (ph_chores_chores): {id, title, description?, status:"pending"|"done", dueDate?, color?}
4. GASTOS (ph_budgeted_expenses): {id, amount, description, category, date, paidStatus:"paid"|"unpaid"|"partial"}
5. DEVHUB (ph_devhub_items): {id, title, type, url?, category, description?} — SIN password/apiKey

ACCIONES (solo si el usuario pide crear/guardar/eliminar/completar):
|ACTION|
{"saveDevHub":{"title":"Nombre","typeField":"youtube","url":"https://...","category":"Media"}}
|END|
|ACTION|
{"deleteDevHub":{"id":"uuid"}}
|END|
|ACTION|
{"updateDevHub":{"id":"uuid","title":"Nuevo titulo","category":"Frontend"}}
|END|
|ACTION|
{"saveChore":{"title":"Hacer ejercicio","dueDate":"2026-07-12","color":"emerald"}}
|END|
|ACTION|
{"completeChore":{"id":"uuid"}}
|END|
|ACTION|
{"deleteChore":{"id":"uuid"}}
|END|
|ACTION|
{"saveCashflow":{"concepto":"Sueldo","monto":15000,"tipo":"ingreso","recurrencia":"mensual","diaDelMes":15}}
|END|
|ACTION|
{"deleteCashflow":{"id":"uuid"}}
|END|
|ACTION|
{"saveExpense":{"amount":500,"description":"Cena","category":"Comida","date":"2026-07-10"}}
|END|
|ACTION|
{"deleteExpense":{"id":"uuid"}}
|END|`

      const contextData = "\nDATOS ACTUALES:\nReglas de flujo de caja: " + rulesRaw + "\nEventos: " + eventsRaw + "\nTareas: " + choresRaw + "\nGastos: " + expensesRaw + "\nDevHub: " + devItemsSafe

      const response = await askAI(text, systemPrompt + "\n" + contextData)
      const hasActionIntent = /crea|guarda|agrega|a[ñn]ade|completa|termina|marca|elimina|borra|registra|inserta|nuev/i.test(text)
      const safeResponse = hasActionIntent ? response : response.replace(/\|ACTION\|\s*\{[\s\S]*?\}\s*\|END\|/gi, "")
      const { cleanText, results } = parseActions(safeResponse)
      const botMsg = addChatMessage({ role: "bot", text: cleanText })
      setMessages(prev => [...prev, botMsg])
      for (const result of results) {
        const resultMsg = addChatMessage({ role: "bot", text: result })
        setMessages(prev => [...prev, resultMsg])
      }
    } catch (err: any) {
      const errorMsg = addChatMessage({ role: "bot", text: err.message || "Error al contactar DevBot." })
      setMessages(prev => [...prev, errorMsg])
    } finally {
      setLoading(false)
    }
  }

  const handleClear = () => {
    clearChatHistory()
    setMessages([])
  }

  const suggestionBtns = suggestions.map(function(s, i) {
    return (
      <button
        key={i}
        onClick={function() { if (!loading) handleSend(s.text) }}
        disabled={loading}
        className={cn(GLASS_INNER, "w-full px-3 py-2 rounded-sm text-left cursor-pointer hover:bg-white/80 dark:hover:bg-zinc-950/80 hover:border-[#76b900]/30 transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed")}
      >
        {s.icon + " " + s.text}
      </button>
    )
  })

  const msgBubbles = messages.map(function(msg) {
    return <MessageBubble key={msg.id} message={msg} />
  })

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.97 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className={cn("fixed bottom-24 right-3 md:right-6 left-3 md:left-auto w-auto md:w-[26rem] flex flex-col z-50 rounded-sm overflow-hidden", GLASS)}
          style={{ height: "520px", maxHeight: "80vh" }}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/30 dark:border-white/10 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-sm bg-[#76b900]/10 border border-[#76b900]/20 flex items-center justify-center relative">
                <Bot className="w-4 h-4 text-[#76b900]" />
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-[#76b900] rounded-full" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-zinc-800 dark:text-zinc-200 font-mono uppercase tracking-wider">DevBot</h3>
                <p className="text-[9px] font-mono text-zinc-400 dark:text-zinc-500">Copiloto de PersonalHub</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={function() { fileInputRef.current?.click() }} className="p-1 rounded-sm border border-white/30 dark:border-white/10 hover:border-[#76b900]/40 transition-colors cursor-pointer group relative" title="Cambiar foto de perfil">
                {avatar ? (
                  <img src={avatar} alt="Tu foto" className="w-6 h-6 rounded-sm object-cover" />
                ) : (
                  <Camera className="w-3.5 h-3.5 text-zinc-400 group-hover:text-[#76b900]" />
                )}
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
              <button onClick={handleClear} className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors cursor-pointer" title="Limpiar historial">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              <button onClick={onClose} className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin" ref={scrollRef}>
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center px-6">
                <div className="w-14 h-14 rounded-sm bg-[#76b900]/5 border border-[#76b900]/10 flex items-center justify-center mb-4 backdrop-blur-sm">
                  <Bot className="w-7 h-7 text-[#76b900]" />
                </div>
                <p className="text-sm font-bold text-zinc-500 dark:text-zinc-400 font-mono uppercase tracking-wider mb-3">Que necesitas?</p>
                <div className="space-y-1.5 text-[10px] font-mono text-zinc-400 dark:text-zinc-500 w-full">
                  {suggestionBtns}
                </div>
              </div>
            ) : (
              msgBubbles
            )}
            {loading && (
              <div className="flex justify-start">
                <div className={cn("flex items-center gap-2.5 px-4 py-3", GLASS_INNER, "rounded-sm")}>
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#76b900] animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-[#76b900] animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-[#76b900] animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-white/30 dark:border-white/10 p-3 shrink-0">
            <ChatInput onSend={handleSend} disabled={loading} />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

