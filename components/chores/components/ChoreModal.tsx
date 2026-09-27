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
  { id: "violet", bg: "bg-violet" },
  { id: "emerald", bg: "bg-pos" },
  { id: "sky", bg: "bg-info" },
  { id: "amber", bg: "bg-warn" },
  { id: "rose", bg: "bg-neg" },
  { id: "teal", bg: "bg-cyan" },
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
        className="panel relative w-full max-w-lg overflow-y-auto max-h-[90vh]">
        <div className="p-f21 sm:p-f34">
          <div className="flex items-center justify-between mb-f21">
            <h3 className="text-base font-medium text-zinc-900 dark:text-white">{chore ? "Editar tarea" : "Nueva tarea"}</h3>
            <button onClick={onClose} className="p-f8 rounded-full text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-900/5 dark:hover:bg-white/5 transition-colors"><X className="w-5 h-5" /></button>
          </div>
          <form onSubmit={submit} className="space-y-f21">
            <div>
              <label className="eyebrow block mb-f8">Tarea</label>
              <input autoFocus required value={title} onChange={e => setTitle(e.target.value)} placeholder="ej. Sacar la basura…"
                className="w-full px-4 py-3 bg-zinc-900/[0.03] dark:bg-white/[0.03] border border-zinc-200 dark:border-white/10 rounded-f13 text-zinc-900 dark:text-white placeholder:text-zinc-500 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/20 font-mono text-sm"
              />
            </div>
            <div>
              <label className="eyebrow block mb-f8">Descripción (opcional)</label>
              <textarea rows={2} value={description} onChange={e => setDescription(e.target.value)} placeholder="Detalles adicionales…"
                className="w-full px-4 py-3 bg-zinc-900/[0.03] dark:bg-white/[0.03] border border-zinc-200 dark:border-white/10 rounded-f13 text-zinc-900 dark:text-white placeholder:text-zinc-500 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/20 font-mono text-sm resize-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-f13">
              <div>
                <label className="eyebrow block mb-f8">Fecha límite</label>
                <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
                  className="w-full px-4 py-3 bg-zinc-900/[0.03] dark:bg-white/[0.03] border border-zinc-200 dark:border-white/10 rounded-f13 text-zinc-900 dark:text-white font-mono text-sm focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/20"
                />
              </div>
              <div>
                <label className="eyebrow block mb-f8">Color</label>
                <div className="flex gap-2 items-center h-full pt-1">
                  {COLORS.map(c => (
                    <button key={c.id} type="button" onClick={() => setColor(c.id)}
                      className={cn("size-[21px] rounded-full transition-all", c.bg,
                        color === c.id ? "ring-2 ring-brand ring-offset-2 dark:ring-offset-zinc-950 scale-110" : "opacity-60 hover:opacity-100")}>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <RippleButton type="submit" rippleColor="#000000" duration="600ms" className="w-full py-f13 bg-brand hover:bg-brand-hi text-black rounded-full text-sm font-semibold transition-colors overflow-hidden">
              {chore ? "Guardar cambios" : "Crear tarea"}
            </RippleButton>
          </form>
        </div>
      </motion.div>
    </div>
  )
}
