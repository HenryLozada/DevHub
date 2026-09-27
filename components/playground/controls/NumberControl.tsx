import type { PropDefinition } from "../types"

interface Props {
  def: PropDefinition
  value: unknown
  onChange: (val: number) => void
}

export function NumberControl({ def, value, onChange }: Props) {
  return (
    <div>
      <label className="block eyebrow block mb-f8">
        {def.label}
      </label>
      <div className="flex items-center gap-2">
        <input
          type="range"
          min={def.min ?? 0}
          max={def.max ?? 100}
          step={def.step ?? 1}
          value={(value as number) ?? 0}
          onChange={(e) => onChange(Number(e.target.value))}
          className="flex-1 accent-brand h-1.5 cursor-pointer"
        />
        <input
          type="number"
          min={def.min ?? 0}
          max={def.max ?? 100}
          step={def.step ?? 1}
          value={(value as number) ?? 0}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-16 px-2 py-1.5 bg-zinc-900/[0.03] dark:bg-white/[0.03] border border-zinc-200 dark:border-white/10 rounded-f13 text-zinc-900 dark:text-white text-xs font-mono text-center focus:outline-none focus:border-brand transition-colors"
        />
      </div>
    </div>
  )
}
