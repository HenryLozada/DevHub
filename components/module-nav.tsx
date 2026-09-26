import { type ReactNode } from "react"

interface ModuleNavProps {
  icon: ReactNode
  title: string
  subtitle?: string
  actions?: ReactNode
  children?: ReactNode
}

export function ModuleNav({ icon, title, subtitle, actions, children }: ModuleNavProps) {
  return (
    <div className="sticky top-16 z-40 border-b border-white/10 bg-zinc-950/95 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-3 md:px-6">
        <div className="flex h-12 md:h-14 items-center justify-between gap-2">
          {/* Left: icon + title */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-[#76b900]/10 border border-[#76b900]/30 text-[#9be01c] flex items-center justify-center shrink-0 select-none shadow-[0_0_14px_rgba(118,185,0,0.25)]">
              {icon}
            </div>
            <div className="min-w-0">
              <span className="font-mono font-bold tracking-wider uppercase text-[11px] md:text-sm text-white truncate block">
                {title}
              </span>
              {subtitle && (
                <span className="text-[9px] md:text-[10px] font-mono text-zinc-500 truncate block">{subtitle}</span>
              )}
            </div>
          </div>

          {/* Right: children (ProfileSwitcher, etc.) + actions */}
          <div className="flex items-center gap-2 md:gap-3 shrink-0">
            {children}
            {actions}
          </div>
        </div>
      </div>
    </div>
  )
}
