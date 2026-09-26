import { useEffect, useRef } from "react"
import { animate } from "motion/react"

interface CountUpProps {
  value: number
  format?: (n: number) => string
  className?: string
  duration?: number
}

/** Animates a number from its previous value to the new one. */
export function CountUp({ value, format = (n) => n.toFixed(0), className, duration = 0.9 }: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const from = useRef(0)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    if (reduce) {
      el.textContent = format(value)
      from.current = value
      return
    }
    const controls = animate(from.current, value, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => {
        el.textContent = format(v)
      },
    })
    from.current = value
    return () => controls.stop()
  }, [value, format, duration])

  return <span ref={ref} className={className}>{format(from.current)}</span>
}
