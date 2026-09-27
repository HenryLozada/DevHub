import type { PropDefinition } from "../types"

interface Props {
  def: PropDefinition
  value: unknown
  onChange: (val: string) => void
}

export function ColorControl({ def, value, onChange }: Props) {
  return (
    <div>
      <label className="block eyebrow block mb-f8">
        {def.label}
      </label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={(value as string) ?? "#000000"}
          onChange={(e) => onChange(e.target.value)}
          className="size-[34px] border border-zinc-200 dark:border-white/10 cursor-pointer rounded-f8 bg-transparent p-0.5"
        />
        <input
          type="text"
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 px-3 py-2 bg-zinc-900/[0.03] dark:bg-white/[0.03] border border-zinc-200 dark:border-white/10 rounded-f13 text-zinc-900 dark:text-white text-xs font-mono focus:outline-none focus:border-brand transition-colors"
        />
      </div>
    </div>
  )
}
