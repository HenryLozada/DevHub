import type { PropDefinition } from "../types"

interface Props {
  def: PropDefinition
  value: unknown
  onChange: (val: string) => void
}

export function StringControl({ def, value, onChange }: Props) {
  return (
    <div>
      <label className="block text-[10px] font-mono font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-1.5">
        {def.label}
      </label>
      <input
        type="text"
        value={(value as string) ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={def.placeholder}
        className="w-full px-3 py-2 bg-zinc-900/[0.03] dark:bg-white/[0.03] border border-zinc-200 dark:border-white/10 rounded-f13 text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:border-brand font-sans text-sm transition-colors"
      />
    </div>
  )
}

export function TextControl({ def, value, onChange }: Props) {
  return (
    <div>
      <label className="block text-[10px] font-mono font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-1.5">
        {def.label}
      </label>
      <textarea
        rows={3}
        value={(value as string) ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={def.placeholder}
        className="w-full px-3 py-2 bg-zinc-900/[0.03] dark:bg-white/[0.03] border border-zinc-200 dark:border-white/10 rounded-f13 text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:border-brand font-sans text-sm transition-colors resize-none"
      />
    </div>
  )
}
