import { useState } from "react"
import { Bot } from "lucide-react"
import { ChatPanel } from "./components/ChatPanel"

export function DevBot() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-24 right-4 md:bottom-6 md:right-6 z-50 size-[55px] rounded-full backdrop-blur-xl bg-white/60 dark:bg-zinc-950/60 border border-zinc-200 dark:border-white/10 shadow-lg shadow-black/10 flex items-center justify-center cursor-pointer hover:bg-white/60 dark:hover:bg-zinc-950/60 hover:border-brand/40 hover:shadow-brand/10 transition-all duration-300 group active:scale-95"
        aria-label="Abrir DevBot"
      >
        <Bot className="w-5 h-5 text-brand group-hover:scale-110 transition-transform" />
      </button>
      <ChatPanel isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  )
}
