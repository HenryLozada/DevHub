import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
import { supabase } from "./supabase"
import { setUserId, uploadToCloud, downloadFromCloud } from "./local-store"
import type { User } from "@supabase/supabase-js"

const KEYS = [
  "cashflow_rules",
  "personal_events_v2",
  "ph_chores_chores",
  "ph_budgeted_expenses",
  "ph_devhub_items",
  "ph_devbot_history",
]

const POLL_INTERVAL = 30_000 // 30 segundos

interface AuthContextType {
  user: User | null
  loading: boolean
  syncVersion: number   // sube cada vez que hay sync exitoso — úsalo como key para forzar re-render
  signUp: (email: string, password: string) => Promise<string | null>
  signIn: (email: string, password: string) => Promise<string | null>
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  syncVersion: 0,
  signUp: async () => null,
  signIn: async () => null,
  signInWithGoogle: async () => {},
  signOut: async () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [syncVersion, setSyncVersion] = useState(0)

  // Descarga todos los datos de Supabase al localStorage y bump syncVersion
  const syncDown = useCallback(async (u: User | null) => {
    if (!u) return
    let anyUpdated = false
    await Promise.all(
      KEYS.map(async (key) => {
        const ok = await downloadFromCloud(key)
        if (ok) anyUpdated = true
        else await uploadToCloud(key) // primera vez: sube el local
      })
    )
    if (anyUpdated) setSyncVersion(v => v + 1)
  }, [])

  useEffect(() => {
    if (!supabase) { setLoading(false); return }

    // Al iniciar: restaurar sesión y descargar datos
    supabase.auth.getSession().then(({ data: { session } }) => {
      const u = session?.user ?? null
      setUser(u)
      setUserId(u?.id || null)
      syncDown(u).finally(() => setLoading(false))
    })

    // Cambios de sesión (login / logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null
      setUser(u)
      setUserId(u?.id || null)
      syncDown(u)
    })

    return () => subscription.unsubscribe()
  }, [syncDown])

  // Polling cada 30s — mantiene los datos sincronizados entre dispositivos
  useEffect(() => {
    if (!user) return
    const id = setInterval(() => syncDown(user), POLL_INTERVAL)
    return () => clearInterval(id)
  }, [user, syncDown])

  async function signUp(email: string, password: string): Promise<string | null> {
    if (!supabase) return "Supabase no configurado"
    const { error } = await supabase.auth.signUp({ email, password })
    return error?.message || null
  }

  async function signIn(email: string, password: string): Promise<string | null> {
    if (!supabase) return "Supabase no configurado"
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return error?.message || null
  }

  async function signInWithGoogle(): Promise<void> {
    if (!supabase) return
    await supabase.auth.signInWithOAuth({ provider: "google" })
  }

  async function signOut(): Promise<void> {
    if (!supabase) return
    await supabase.auth.signOut()
    setUserId(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, syncVersion, signUp, signIn, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  return useContext(AuthContext)
}
