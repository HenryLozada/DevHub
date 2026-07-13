import { useState, useCallback, useEffect } from "react"
import { AnimatePresence, motion } from "motion/react"
import { CheckCircle2 } from "lucide-react"
import { ModuleNav } from "@/components/module-nav"
import { getChores } from "./store"
import { Chore } from "./types"
import { Dashboard } from "./components/Dashboard"

export function ChoresApp() {
  const [chores, setChores] = useState<Chore[]>([])

  const reload = useCallback(() => setChores(getChores()), [])

  useEffect(() => { reload() }, [reload])

  useEffect(() => {
    const handler = () => reload();
    window.addEventListener("ph:update", handler);
    return () => window.removeEventListener("ph:update", handler);
  }, [reload])

  return (
    <div className="min-h-screen bg-[#fafafc] dark:bg-[#000000]">
      <ModuleNav
        icon={<CheckCircle2 className="w-4 h-4 text-[#76b900]" />}
        title="Tareas"
      />
      <AnimatePresence mode="wait">
        <motion.div
          key="dashboard"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2 }}
        >
          <Dashboard chores={chores} onRefresh={reload} />
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
