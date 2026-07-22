import { useState, useEffect, type FormEvent } from "react"
import { motion } from "motion/react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"
import { RippleButton } from "@/components/ui/ripple-button"
import { updateChore, saveChore } from "../store"
import { Chore } from "../types"

interface ChoreModalProps {
  chore?: Chore | null
  onClose: () => void
  onSaved: () => void
}

const COLORS = [
  { id: "violet", bg: "bg-violet-500" },
  { id: "emerald", bg: "bg-emerald-500" },
  { id: "sky", bg: "bg-sky-500" },
  { id: "amber", bg: "bg-amber-500" },
  { id: "rose", bg: "bg-rose-500" },
  { id: "teal", bg: "bg-teal-500" },
]

export function ChoreModal({ chore, onClose, onSaved }: ChoreModalProps) {
  const [title, setTitle] = useState(chore?.title ?? "")
  const [description, setDescription] = useState(chore?.description ?? "")
  const [dueDate, setDueDate] = useState(chore?.dueDate ?? "")
  const [color, setColor] = useState(chore?.color ?? "violet")

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onClose])

  function submit(e: FormEvent) {
    e.preventDefault()
    const data = {
      title: title.trim(),
      description: description.trim() || undefined,
      dueDate: dueDate || undefined,
      status: "pending" as const,
      color,
    }
    if (chore) {
      updateChore(chore.id, data)
    } else {
      saveChore(data)
    }
    onSaved()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/40 backdrop-blur-xs" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-none shadow-sm overflow-hidden overflow-y-auto max-h-[90vh]">
        <div className="corner-square" />
        <div className="p-4 sm:p-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white font-mono uppercase tracking-wider">{chore ? "EDITAR TAREA" : "NUEVA TAREA"}</h3>
            <button onClick={onClose} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-none text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800"><X className="w-5 h-5" /></button>
          </div>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block font-mono text-[10px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">Tarea</label>
              <input autoFocus required value={title} onChange={e => setTitle(e.target.value)} placeholder="ej. Sacar la basura…"
                className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-none text-zinc-900 dark:text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#76b900] focus:ring-1 focus:ring-[#76b900]/20 font-mono text-sm"
              />
            </div>
            <div>
              <label className="block font-mono text-[10px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">Descripción (opcional)</label>
              <textarea rows={2} value={description} onChange={e => setDescription(e.target.value)} placeholder="Detalles adicionales…"
                className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-none text-zinc-900 dark:text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#76b900] focus:ring-1 focus:ring-[#76b900]/20 font-mono text-sm resize-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-mono text-[10px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">Fecha límite</label>
                <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
                  className="w-full px-4 py-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-none text-zinc-900 dark:text-white font-mono text-sm focus:outline-none focus:border-[#76b900] focus:ring-1 focus:ring-[#76b900]/20"
                />
              </div>
              <div>
                <label className="block font-mono text-[10px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">Color</label>
                <div className="flex gap-2 items-center h-full pt-1">
                  {COLORS.map(c => (
                    <button key={c.id} type="button" onClick={() => setColor(c.id)}
                      className={cn("w-6 h-6 rounded-none transition-all", c.bg,
                        color === c.id ? "ring-2 ring-[#76b900] ring-offset-2 dark:ring-offset-zinc-950 scale-110" : "opacity-60 hover:opacity-100")}>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <RippleButton type="submit" rippleColor="#000000" duration="600ms" className="w-full py-3.5 bg-[#76b900] hover:bg-[#86cb00] text-black rounded-none font-mono text-xs uppercase tracking-wider font-bold transition-all overflow-hidden">
              {chore ? "GUARDAR CAMBIOS" : "CREAR TAREA"}
            </RippleButton>
          </form>
        </div>
      </motion.div>
    </div>
  )
}
