import { useState } from "react"
import { LogOut, User } from "lucide-react"
import { useAuth } from "@/lib/auth-store"

export function UserMenu() {
  const { user, signOut } = useAuth()
  const [open, setOpen] = useState(false)

  if (!user) return null

  const initial = user.email?.charAt(0).toUpperCase() || "U"

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="w-7 h-7 rounded-sm bg-[#76b900]/10 border border-[#76b900]/20 flex items-center justify-center text-[10px] font-bold font-mono text-[#76b900] cursor-pointer hover:bg-[#76b900]/20 transition-colors"
        title={user.email || ""}
      >
        {initial}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-9 z-50 w-48 backdrop-blur-xl bg-white/40 dark:bg-zinc-950/40 border border-white/30 dark:border-white/10 rounded-sm shadow-sm overflow-hidden">
            <div className="px-3 py-2 border-b border-white/30 dark:border-white/10">
              <p className="text-[10px] font-mono font-bold text-zinc-800 dark:text-zinc-200 truncate">{user.email}</p>
            </div>
            <button
              onClick={() => { signOut(); setOpen(false) }}
              className="w-full flex items-center gap-2 px-3 py-2 text-[10px] font-mono text-zinc-500 hover:text-red-500 hover:bg-red-500/5 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" /> Cerrar sesión
            </button>
          </div>
        </>
      )}
    </div>
  )
}
