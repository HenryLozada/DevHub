import type { PropDefinition } from "../types"

interface Props {
  def: PropDefinition
  value: unknown
  onChange: (val: number) => void
}

export function NumberControl({ def, value, onChange }: Props) {
  return (
    <div>
      <label className="block text-[10px] font-mono font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-1.5">
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
          className="flex-1 accent-[#76b900] h-1.5 cursor-pointer"
        />
        <input
          type="number"
          min={def.min ?? 0}
          max={def.max ?? 100}
          step={def.step ?? 1}
          value={(value as number) ?? 0}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-16 px-2 py-1.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-none text-zinc-900 dark:text-white text-xs font-mono text-center focus:outline-none focus:border-[#76b900] transition-colors"
        />
      </div>
    </div>
  )
}
