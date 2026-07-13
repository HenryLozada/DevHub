import { useState } from "react"
import { Bot } from "lucide-react"
import { ChatPanel } from "./components/ChatPanel"

export function DevBot() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-sm backdrop-blur-xl bg-white/40 dark:bg-zinc-950/40 border border-white/30 dark:border-white/10 shadow-lg shadow-black/10 flex items-center justify-center cursor-pointer hover:bg-white/60 dark:hover:bg-zinc-950/60 hover:border-[#76b900]/40 hover:shadow-[#76b900]/10 transition-all duration-300 group active:scale-95"
        aria-label="Abrir DevBot"
      >
        <Bot className="w-5 h-5 text-[#76b900] group-hover:scale-110 transition-transform" />
      </button>
      <ChatPanel isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  )
}
