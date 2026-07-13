import { useState, useCallback, useEffect } from "react"
import { Wallet } from "lucide-react"
import { ModuleNav } from "@/components/module-nav"
import { getExpenses } from "./store"
import { Expense } from "./types"
import { Dashboard } from "./components/Dashboard"

export function BudgetedApp() {
  const [expenses, setExpenses] = useState<Expense[]>([])

  const reload = useCallback(() => setExpenses(getExpenses()), [])

  useEffect(() => { reload() }, [reload])

  useEffect(() => {
    const handler = () => reload();
    window.addEventListener("ph:update", handler);
    return () => window.removeEventListener("ph:update", handler);
  }, [reload])

  return (
    <div className="min-h-screen bg-[#fafafc] dark:bg-[#000000]">
      <ModuleNav
        icon={<Wallet className="w-4 h-4 text-[#76b900]" />}
        title="Gastos"
      />
      <Dashboard expenses={expenses} onRefresh={reload} />
    </div>
  )
}
