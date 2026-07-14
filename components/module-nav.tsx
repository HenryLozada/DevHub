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
    <div className="sticky top-16 z-40 bg-zinc-950 border-b border-zinc-800">
      <div className="mx-auto max-w-7xl px-3 md:px-6">
        <div className="flex h-12 md:h-14 items-center justify-between gap-2">
          {/* Left: icon + title */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 md:w-8 md:h-8 bg-zinc-900 border border-zinc-800 flex items-center justify-center relative shrink-0 select-none">
              <div className="absolute top-0 left-0 w-1.5 h-1.5 md:w-2 md:h-2 bg-[#76b900]" />
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
