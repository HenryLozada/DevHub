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
        className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-none text-zinc-900 dark:text-white text-sm focus:outline-none focus:border-[#76b900] transition-colors"
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
