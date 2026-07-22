import type { PropDefinition } from "../types"

interface Props {
  def: PropDefinition
  value: unknown
  onChange: (val: string) => void
}

export function ColorControl({ def, value, onChange }: Props) {
  return (
    <div>
      <label className="block text-[10px] font-mono font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-1.5">
        {def.label}
      </label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={(value as string) ?? "#000000"}
          onChange={(e) => onChange(e.target.value)}
          className="w-10 h-10 border border-zinc-200 dark:border-zinc-800 cursor-pointer rounded-none bg-transparent p-0.5"
        />
        <input
          type="text"
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-none text-zinc-900 dark:text-white text-xs font-mono focus:outline-none focus:border-[#76b900] transition-colors"
        />
      </div>
    </div>
  )
}
