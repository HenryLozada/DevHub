import { useState, useEffect } from "react"
import { ChatMessage } from "../types"
import { cn } from "@/lib/utils"
import { Bot, User } from "lucide-react"
import { getAvatar } from "@/lib/avatar"

const GLASS_BOT = "backdrop-blur-md bg-white/60 dark:bg-zinc-950/60 border border-white/40 dark:border-white/[0.08] shadow-sm shadow-black/5"
const GLASS_USER = "bg-black/5 dark:bg-white/5 backdrop-blur-md border border-white/40 dark:border-white/[0.08] shadow-sm"

function renderMarkdown(text: string) {
  if (!text) return ""
  const parts = text.split("```")
  return parts.map((part, index) => {
    const isCodeBlock = index % 2 === 1
    if (isCodeBlock) {
      const lines = part.split("\n")
      const firstLine = lines[0].trim()
      const hasLang = /^[a-zA-Z0-9_-]+$/.test(firstLine)
      const codeContent = hasLang ? lines.slice(1).join("\n") : part
      return (
        <pre key={index} className="my-2 p-2.5 bg-zinc-900/80 dark:bg-black/60 backdrop-blur-sm border border-white/10 text-[10px] font-mono text-zinc-100 overflow-x-auto rounded-sm select-all relative">
          {hasLang && <span className="absolute right-2 top-1.5 text-[8px] font-mono font-bold text-zinc-600 uppercase tracking-widest select-none">{firstLine}</span>}
          <code>{codeContent.trim()}</code>
        </pre>
      )
    }
    const subParts = part.split("**")
    const processedText = subParts.map((subPart, subIndex) => {
      const isBold = subIndex % 2 === 1
      const inlineParts = subPart.split("`")
      const inlineProcessed = inlineParts.map((inlinePart, inlineIndex) => {
        const isInlineCode = inlineIndex % 2 === 1
        if (isInlineCode) {
          return <code key={inlineIndex} className="px-1 py-0.5 bg-zinc-800/80 text-[#76b900] font-mono text-[10px] border border-white/10 rounded-sm">{inlinePart}</code>
        }
        return inlinePart
      })
      if (isBold) return <strong key={subIndex} className="font-bold text-[#76b900]">{inlineProcessed}</strong>
      return inlineProcessed
    })
    return <span key={index}>{processedText}</span>
  })
}

export function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user"
  const [avatar, setAvatar] = useState<string | null>(null)

  useEffect(function() {
    setAvatar(getAvatar())
  }, [])

  return (
    <div className={cn("flex items-start gap-2.5", isUser ? "flex-row-reverse" : "")}>
      <div className={cn("shrink-0 w-7 h-7 rounded-sm flex items-center justify-center mt-0.5 overflow-hidden", isUser
        ? "bg-zinc-200/60 dark:bg-zinc-800/60 border border-white/30 dark:border-white/10 backdrop-blur-sm"
        : "bg-[#76b900]/10 border border-[#76b900]/20"
      )}>
        {isUser && avatar ? (
          <img src={avatar} alt="Tu foto" className="w-full h-full object-cover" />
        ) : isUser ? (
          <User className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
        ) : (
          <Bot className="w-3.5 h-3.5 text-[#76b900]" />
        )}
      </div>
      <div className={cn("max-w-[85%] px-3.5 py-2.5 text-xs whitespace-pre-wrap leading-relaxed", isUser ? GLASS_USER : GLASS_BOT, "rounded-sm")}>
        <div className={cn("text-zinc-800 dark:text-zinc-200")}>
          {renderMarkdown(message.text)}
        </div>
      </div>
    </div>
  )
}
