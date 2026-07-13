import { motion } from "motion/react"
import { CheckCircle2, Circle, Pencil, Trash2 } from "lucide-react"
import { isBefore, startOfDay } from "date-fns"
import { cn } from "@/lib/utils"
import { Chore } from "../types"

const COLOR_BORDER: Record<string, string> = {
  violet: "border-violet-400 dark:border-violet-600",
  emerald: "border-emerald-400 dark:border-emerald-600",
  sky: "border-sky-400 dark:border-sky-600",
  amber: "border-amber-400 dark:border-amber-600",
  rose: "border-rose-400 dark:border-rose-600",
  teal: "border-teal-400 dark:border-teal-600",
}

interface ChoreCardProps {
  chore: Chore
  onEdit: () => void
  onDelete: () => void
  onToggle: () => void
}

export function ChoreCard({ chore, onEdit, onDelete, onToggle }: ChoreCardProps) {
  const isDone = chore.status === "done"

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={cn(
        "group flex items-start gap-4 p-4 rounded-none border transition-all relative overflow-hidden",
        isDone
          ? "bg-zinc-50 dark:bg-zinc-900/30 border-zinc-200 dark:border-zinc-800 opacity-60"
          : "bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 hover:border-[#76b900]/30 shadow-xs"
      )}
    >
      <button onClick={onToggle} className="mt-0.5 shrink-0 transition-all active:scale-90">
        {isDone ? (
          <CheckCircle2 className="w-5 h-5 text-[#76b900]" />
        ) : (
          <Circle className="w-5 h-5 text-zinc-300 dark:text-zinc-600 hover:text-[#76b900] transition-colors" />
        )}
      </button>
      <div className="flex-1 min-w-0">
        <p className={cn("font-bold text-sm font-sans", isDone ? "line-through text-zinc-400 dark:text-zinc-500" : "text-zinc-900 dark:text-white")}>
          {chore.title}
        </p>
        {chore.description && <p className="text-xs text-zinc-400 mt-0.5 line-clamp-1">{chore.description}</p>}
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          {chore.color && (
            <span className={cn("w-2 h-2 rounded-none shrink-0", COLOR_BORDER[chore.color]?.replace("border-", "bg-").replace("dark:border-", "dark:bg-"))} />
          )}
          {chore.dueDate && (
            <span
              className={cn(
                "text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-none border",
                isBefore(new Date(chore.dueDate), startOfDay(new Date())) && !isDone
                  ? "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900/30"
                  : "bg-zinc-100 text-zinc-500 border-zinc-200 dark:bg-zinc-900 dark:text-zinc-400 dark:border-zinc-800"
              )}
            >
              {chore.dueDate}
            </span>
          )}
        </div>
      </div>
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <button onClick={onEdit} className="p-1.5 hover:bg-[#76b900]/10 text-zinc-400 hover:text-[#76b900] rounded-none transition-colors border border-transparent hover:border-[#76b900]/20"><Pencil className="w-3.5 h-3.5" /></button>
        <button onClick={onDelete} className="p-1.5 hover:bg-red-500/10 text-zinc-400 hover:text-red-500 rounded-none transition-colors border border-transparent hover:border-red-500/20"><Trash2 className="w-3.5 h-3.5" /></button>
      </div>
    </motion.div>
  )
}
