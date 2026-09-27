import type { PropDefinition } from "../types"

interface Props {
  def: PropDefinition
  value: unknown
  onChange: (val: string) => void
}

export function SelectControl({ def, value, onChange }: Props) {
  return (
    <div>
      <label className="block text-[10px] font-mono font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-1.5">
        {def.label}
      </label>
      <select
        value={(value as string) ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 bg-zinc-900/[0.03] dark:bg-white/[0.03] border border-zinc-200 dark:border-white/10 rounded-f13 text-zinc-900 dark:text-white text-sm focus:outline-none focus:border-brand transition-colors"
      >
        {def.options?.map((opt) => (
          <option key={String(opt.value)} value={String(opt.value)}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  )
}
