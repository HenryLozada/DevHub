import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from "react"
import { supabase } from "./supabase"
import { setUserId, reconcile, clearLocalUserData, getStoreKeys } from "./local-store"
import type { User } from "@supabase/supabase-js"

const POLL_INTERVAL = 30_000

interface AuthContextType {
  user: User | null
  loading: boolean
  syncVersion: number
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
  const syncingRef = useRef(false)
  const lastUserIdRef = useRef<string | null>(null)

  const syncDown = useCallback(async (u: User | null) => {
    if (!u) return
    if (syncingRef.current) return
    syncingRef.current = true
    try {
      let anyUpdated = false
      const keys = getStoreKeys()
      await Promise.all(
        keys.map(async (key) => {
          if ((await reconcile(key)) === "updated") anyUpdated = true
        })
      )
      if (anyUpdated) setSyncVersion((v) => v + 1)
    } finally {
      syncingRef.current = false
    }
  }, [])

  useEffect(() => {
    if (!supabase) {
      // Dev only: without Supabase credentials run as a local demo user (stripped from production builds)
      if (import.meta.env.DEV) {
        void import("./demo-seed").then(({ seedDemoData }) => {
          seedDemoData()
          setUser({ id: "demo-user", email: "demo@local" } as User)
          setLoading(false)
        })
        return
      }
      setLoading(false)
      return
    }

    let initialDone = false

    supabase.auth.getSession().then(({ data: { session } }) => {
      const u = session?.user ?? null
      setUser(u)
      setUserId(u?.id || null)
      lastUserIdRef.current = u?.id || null
      syncDown(u).finally(() => {
        initialDone = true
        setLoading(false)
      })
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      const u = session?.user ?? null
      const nextId = u?.id || null

      if (event === "SIGNED_OUT") {
        clearLocalUserData()
        lastUserIdRef.current = null
        setUser(null)
        setUserId(null)
        setSyncVersion((v) => v + 1)
        return
      }

      if (event === "INITIAL_SESSION") return

      if (nextId && lastUserIdRef.current && lastUserIdRef.current !== nextId) {
        clearLocalUserData()
      }

      setUser(u)
      setUserId(nextId)
      lastUserIdRef.current = nextId

      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        if (!initialDone && event === "TOKEN_REFRESHED") return
        await syncDown(u)
      }
    })

    return () => subscription.unsubscribe()
  }, [syncDown])

  useEffect(() => {
    if (!user) return
    // Poll only while the tab is visible; catch up as soon as it becomes visible again
    const id = setInterval(() => {
      if (!document.hidden) syncDown(user)
    }, POLL_INTERVAL)
    const onVisible = () => {
      if (!document.hidden) syncDown(user)
    }
    document.addEventListener("visibilitychange", onVisible)
    return () => {
      clearInterval(id)
      document.removeEventListener("visibilitychange", onVisible)
    }
  }, [user, syncDown])

  async function signUp(email: string, password: string): Promise<string | null> {
    if (!supabase) return "Supabase no configurado"
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) return error.message
    if (data.user && !data.session) {
      return "Revisa tu correo para confirmar la cuenta antes de iniciar sesión."
    }
    return null
  }

  async function signIn(email: string, password: string): Promise<string | null> {
    if (!supabase) return "Supabase no configurado"
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return error?.message || null
  }

  async function signInWithGoogle(): Promise<void> {
    if (!supabase) return
    const redirectTo = typeof window !== "undefined" ? `${window.location.origin}/` : undefined
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: redirectTo ? { redirectTo } : undefined,
    })
  }

  async function signOut(): Promise<void> {
    if (!supabase) return
    clearLocalUserData()
    lastUserIdRef.current = null
    setUser(null)
    setUserId(null)
    setSyncVersion((v) => v + 1)
    await supabase.auth.signOut()
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
