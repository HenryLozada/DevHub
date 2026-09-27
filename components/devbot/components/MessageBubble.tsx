import { useState, useEffect } from "react"
import { ChatMessage } from "../types"
import { cn } from "@/lib/utils"
import { Bot, User } from "lucide-react"
import { getAvatar } from "@/lib/avatar"

const GLASS_BOT = "bg-zinc-900/[0.03] dark:bg-white/[0.04] border border-zinc-900/5 dark:border-white/[0.06]"
const GLASS_USER = "bg-brand/10 border border-brand/20"

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
        <pre key={index} className="my-2 p-2.5 bg-zinc-900/80 dark:bg-black/60 backdrop-blur-sm border border-white/10 text-[10px] font-mono text-zinc-100 overflow-x-auto rounded-f8 select-all relative">
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
          return <code key={inlineIndex} className="px-1 py-0.5 bg-zinc-800/80 text-brand font-mono text-[10px] border border-white/10 rounded-f5">{inlinePart}</code>
        }
        return inlinePart
      })
      if (isBold) return <strong key={subIndex} className="font-bold text-brand">{inlineProcessed}</strong>
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
      <div className={cn("shrink-0 w-7 h-7 rounded-full flex items-center justify-center mt-0.5 overflow-hidden", isUser
        ? "bg-zinc-200/60 dark:bg-zinc-800/60 border border-white/30 dark:border-white/10 backdrop-blur-sm"
        : "bg-brand/10 border border-brand/20"
      )}>
        {isUser && avatar ? (
          <img src={avatar} alt="Tu foto" className="w-full h-full object-cover" />
        ) : isUser ? (
          <User className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
        ) : (
          <Bot className="w-3.5 h-3.5 text-brand" />
        )}
      </div>
      <div className={cn("max-w-[85%] px-3.5 py-2.5 text-xs whitespace-pre-wrap leading-relaxed", isUser ? GLASS_USER : GLASS_BOT, isUser ? "rounded-f13 rounded-tr-f3" : "rounded-f13 rounded-tl-f3")}>
        <div className={cn("text-zinc-800 dark:text-zinc-200")}>
          {renderMarkdown(message.text)}
        </div>
      </div>
    </div>
  )
}
