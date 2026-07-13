import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
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

interface AuthContextType {
  user: User | null
  loading: boolean
  signUp: (email: string, password: string) => Promise<string | null>
  signIn: (email: string, password: string) => Promise<string | null>
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signUp: async () => null,
  signIn: async () => null,
  signInWithGoogle: async () => {},
  signOut: async () => {},
})

function onUserChanged(user: User | null) {
  setUserId(user?.id || null)
  if (!user) return

  // On login: download each dataset from cloud to localStorage
  KEYS.forEach(async (key) => {
    const ok = await downloadFromCloud(key)
    if (!ok) {
      // Nothing in cloud yet — push local data up
      await uploadToCloud(key)
    }
  })
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!supabase) { setLoading(false); return }

    supabase.auth.getSession().then(({ data: { session } }) => {
      const u = session?.user ?? null
      setUser(u)
      onUserChanged(u)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null
      setUser(u)
      onUserChanged(u)
    })

    return () => subscription.unsubscribe()
  }, [])

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
    <AuthContext.Provider value={{ user, loading, signUp, signIn, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  return useContext(AuthContext)
}
