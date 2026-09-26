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
    <div className="sticky top-16 z-40 border-b border-black/5 bg-white/80 backdrop-blur-xl dark:border-white/[0.06] dark:bg-zinc-950/80">
      <div className="mx-auto max-w-7xl px-3 md:px-6">
        <div className="flex h-12 md:h-14 items-center justify-between gap-2">
          {/* Left: icon + title */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="size-[34px] rounded-f13 border border-black/5 dark:border-white/10 text-brand flex items-center justify-center shrink-0 select-none">
              {icon}
            </div>
            <div className="min-w-0">
              <span className="eyebrow block truncate !text-zinc-900 dark:!text-zinc-100">
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
