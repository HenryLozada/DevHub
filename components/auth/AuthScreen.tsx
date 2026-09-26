import { useState } from "react"
import { FlickeringGrid } from "@/components/ui/flickering-grid"
import { motion } from "motion/react"
import { Mail, Lock } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth-store"
import { RippleButton } from "@/components/ui/ripple-button"

const GLASS = "backdrop-blur-xl bg-white/40 dark:bg-zinc-950/40 border border-white/30 dark:border-white/10"

export function AuthScreen() {
  const { signUp, signIn, signInWithGoogle } = useAuth()
  const [mode, setMode] = useState<"login" | "signup">("login")
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
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <FlickeringGrid
        className="absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_75%)]"
        squareSize={3}
        gridGap={7}
        color="#76b900"
        maxOpacity={0.35}
        flickerChance={0.12}
      />
      <motion.div
        aria-hidden
        animate={{ scale: [1, 1.15, 1], opacity: [0.35, 0.6, 0.35] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        className="absolute size-[28rem] rounded-full bg-[#76b900]/20 blur-3xl pointer-events-none"
      />

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 24 }}
        className={cn(GLASS, "relative w-full max-w-sm rounded-2xl p-5 sm:p-8 shadow-2xl shadow-black/20")}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 mb-6 justify-center">
          <motion.div
            initial={{ rotate: -20, scale: 0.6 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 14, delay: 0.1 }}
            className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#76b900] to-[#b6f03a] flex items-center justify-center shadow-[0_0_24px_rgba(118,185,0,0.55)]"
          >
            <span className="text-black font-black font-mono text-lg tracking-tight">P</span>
          </motion.div>
          <div>
            <h1 className="text-base font-bold text-zinc-900 dark:text-white tracking-tight">Personal<span className="text-brand-gradient">Hub</span></h1>
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

          <RippleButton
            type="submit"
            disabled={busy}
            rippleColor="#000000"
            duration="600ms"
            className="w-full py-2.5 bg-[#76b900] text-black rounded-sm text-[10px] font-mono font-bold uppercase tracking-wider hover:bg-[#86cb00] transition-all border border-[#76b900] cursor-pointer disabled:opacity-50 shadow-sm shadow-[#76b900]/20 overflow-hidden"
          >
            {busy ? "..." : mode === "signup" ? "Crear cuenta" : "Iniciar sesión"}
          </RippleButton>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-white/30 dark:bg-white/10" />
          <span className="text-[9px] font-mono text-zinc-400 dark:text-zinc-500 uppercase">o</span>
          <div className="flex-1 h-px bg-white/30 dark:bg-white/10" />
        </div>

        {/* Google */}
        <RippleButton
          onClick={signInWithGoogle}
          rippleColor="#ffffff"
          duration="600ms"
          className="w-full py-2.5 bg-white/50 dark:bg-zinc-900/50 border border-white/40 dark:border-white/10 rounded-sm text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 hover:bg-white/80 dark:hover:bg-zinc-900/80 transition-all cursor-pointer flex items-center justify-center gap-2 overflow-hidden"
        >
          <span className="text-sm font-bold">G</span> Google
        </RippleButton>

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
