import { useState, useRef, KeyboardEvent } from "react"
import { CornerDownLeft } from "lucide-react"

interface ChatInputProps {
  onSend: (text: string) => void
  disabled?: boolean
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [text, setText] = useState("")
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      if (text.trim() && !disabled) {
        onSend(text.trim())
        setText("")
      }
    }
  }

  const handleSend = () => {
    if (text.trim() && !disabled) {
      onSend(text.trim())
      setText("")
    }
  }

  return (
    <div className="relative w-full">
      <textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder="Pregúntale a DevBot..."
        className="w-full resize-none bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm border border-white/40 dark:border-white/10 rounded-sm px-3 py-2.5 pr-10 text-xs font-mono text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-[#76b900] transition-colors min-h-[36px] max-h-[100px] leading-relaxed"
        rows={1}
      />
      <button
        onClick={handleSend}
        disabled={disabled || !text.trim()}
        className="absolute right-2 bottom-2 p-1.5 text-zinc-400 hover:text-[#76b900] disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
      >
        <CornerDownLeft className="w-4 h-4" />
      </button>
    </div>
  )
}
