import { useState } from "react"
import { motion } from "motion/react"
import { Mail, Lock } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth-store"

const GLASS = "backdrop-blur-xl bg-white/40 dark:bg-zinc-950/40 border border-white/30 dark:border-white/10"

export function AuthScreen() {
  const { signUp, signIn, signInWithGoogle } = useAuth()
  const [mode, setMode] = useState<"login" | "signup">("signup")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setMessage(null)
    setBusy(true)

    if (mode === "signup") {
      const err = await signUp(email, password)
      if (err) setError(err)
      else setMessage("Revisa tu correo para confirmar la cuenta")
    } else {
      const err = await signIn(email, password)
      if (err) setError(err)
    }

    setBusy(false)
  }

  return (
    <div className="min-h-screen bg-[#fafafc] dark:bg-[#000000] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute -top-20 right-10 w-72 h-72 bg-[#76b900]/5 blur-3xl rounded-full pointer-events-none" />
      <div className="absolute -bottom-20 left-10 w-56 h-56 bg-violet-500/5 blur-3xl rounded-full pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={cn(GLASS, "w-full max-w-sm rounded-sm p-4 sm:p-8 shadow-sm")}
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5 mb-6 justify-center">
          <div className="w-9 h-9 bg-zinc-900 dark:bg-zinc-800 border border-zinc-700 flex items-center justify-center relative">
            <div className="absolute top-0 left-0 w-2 h-2 bg-[#76b900]" />
            <span className="text-[#76b900] font-bold font-mono text-sm tracking-tight">P</span>
          </div>
          <div>
            <h1 className="text-sm font-bold text-zinc-900 dark:text-white font-mono uppercase tracking-wider">PersonalHub</h1>
            <p className="text-[9px] font-mono text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Tu espacio personal</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Correo electrónico"
              required
              className="w-full pl-9 pr-4 py-2.5 bg-white/50 dark:bg-zinc-900/50 border border-white/40 dark:border-white/10 rounded-sm text-xs font-mono text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 focus:outline-none focus:border-[#76b900] transition-colors"
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Contraseña"
              required
              minLength={6}
              className="w-full pl-9 pr-4 py-2.5 bg-white/50 dark:bg-zinc-900/50 border border-white/40 dark:border-white/10 rounded-sm text-xs font-mono text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 focus:outline-none focus:border-[#76b900] transition-colors"
            />
          </div>

          {error && <p className="text-[10px] font-mono text-red-500">{error}</p>}
          {message && <p className="text-[10px] font-mono text-[#76b900]">{message}</p>}

          <button
            type="submit"
            disabled={busy}
            className="w-full py-2.5 bg-[#76b900] text-black rounded-sm text-[10px] font-mono font-bold uppercase tracking-wider hover:bg-[#86cb00] transition-all border border-[#76b900] cursor-pointer disabled:opacity-50 shadow-sm shadow-[#76b900]/20"
          >
            {busy ? "..." : mode === "signup" ? "Crear cuenta" : "Iniciar sesión"}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-white/30 dark:bg-white/10" />
          <span className="text-[9px] font-mono text-zinc-400 dark:text-zinc-500 uppercase">o</span>
          <div className="flex-1 h-px bg-white/30 dark:bg-white/10" />
        </div>

        {/* Google */}
        <button
          onClick={signInWithGoogle}
          className="w-full py-2.5 bg-white/50 dark:bg-zinc-900/50 border border-white/40 dark:border-white/10 rounded-sm text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 hover:bg-white/80 dark:hover:bg-zinc-900/80 transition-all cursor-pointer flex items-center justify-center gap-2"
        >
          <span className="text-sm font-bold">G</span> Google
        </button>

        {/* Toggle */}
        <p className="mt-5 text-[10px] font-mono text-zinc-400 dark:text-zinc-500 text-center">
          {mode === "signup" ? "¿Ya tienes cuenta?" : "¿No tienes cuenta?"}{" "}
          <button onClick={() => { setMode(mode === "signup" ? "login" : "signup"); setError(null); setMessage(null) }}
            className="text-[#76b900] hover:underline cursor-pointer font-bold">
            {mode === "signup" ? "Inicia sesión" : "Regístrate"}
          </button>
        </p>
      </motion.div>
    </div>
  )
}
