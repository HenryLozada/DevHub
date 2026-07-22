import type { PropDefinition } from "../types"

interface Props {
  def: PropDefinition
  value: unknown
  onChange: (val: boolean) => void
}

export function BooleanControl({ def, value, onChange }: Props) {
  return (
    <div className="flex items-center justify-between">
      <label className="text-[10px] font-mono font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">
        {def.label}
      </label>
      <button
        type="button"
        onClick={() => onChange(!value)}
        className={`relative w-10 h-5 rounded-sm transition-colors border ${
          value
            ? "bg-[#76b900] border-[#76b900]"
            : "bg-zinc-200 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-sm transition-transform ${
            value ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  )
}
