import { useEffect, useRef } from "react"
import { cn } from "@/lib/utils"

/**
 * Barra de pixeles viva: la misma rejilla del fondo, que se llena celda a celda,
 * respira con una ola de luz, chispea en el borde de avance y brilla bajo el cursor.
 * `segments` son fracciones (0–1) con un color CSS (acepta var(--color-…)).
 */

const CELL = 5
const SQ = 4

export interface PixelSegment { value: number; color: string }

const hash = (i: number, j: number, s: number) => {
  const h = Math.sin(i * 127.1 + j * 311.7 + s * 74.7) * 43758.5453
  return h - Math.floor(h)
}

export function PixelBar({ segments, rows = 2, className, label }: { segments: PixelSegment[]; rows?: number; className?: string; label?: string }) {
  const hostRef = useRef<HTMLDivElement>(null)
  const segRef = useRef(segments)
  segRef.current = segments

  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    canvas.style.cssText = "position:absolute;inset:0;width:100%;height:100%"
    host.appendChild(canvas)
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches

    // Traduce colores CSS (incluidas variables) a rgb para el canvas
    const probe = document.createElement("span")
    probe.style.display = "none"
    host.appendChild(probe)
    const cache = new Map<string, [number, number, number]>()
    const rgb = (c: string) => {
      let v = cache.get(c)
      if (!v) {
        probe.style.color = c
        const m = getComputedStyle(probe).color.match(/[\d.]+/g) ?? ["118", "185", "0"]
        v = [+m[0], +m[1], +m[2]]
        cache.set(c, v)
      }
      return v
    }
    const themeObs = new MutationObserver(() => cache.clear())
    themeObs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] })

    let W = 0, H = 0, cols = 0
    const resize = () => {
      W = host.clientWidth; H = host.clientHeight
      cols = Math.max(1, Math.floor(W / CELL))
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(host)

    let mx = -9999
    const onMove = (e: PointerEvent) => {
      const r = host.getBoundingClientRect()
      mx = e.clientY >= r.top - 21 && e.clientY <= r.bottom + 21 ? e.clientX - r.left : -9999
    }
    window.addEventListener("pointermove", onMove, { passive: true })

    let visible = true
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting })
    io.observe(host)

    let shown = 0 // fracción llenada (anima hacia el total)
    let raf = 0, last = performance.now(), t = 0

    const draw = (now: number) => {
      const dt = Math.min((now - last) / 1000, 1 / 30)
      last = now; t += dt
      if (visible && !document.hidden) {
        const segs = segRef.current
        const total = Math.min(1, segs.reduce((s, x) => s + Math.max(0, x.value), 0))
        shown = reduce ? total : shown + (total - shown) * (1 - Math.exp(-3.2 * dt))
        const litCols = shown * cols
        const edge = Math.floor(litCols)
        const tick = Math.floor(t * 10)
        // latido: un pulso de luz que recorre la parte llena
        const runner = (t * 34) % (edge + 34) - 8
        const dark = document.documentElement.classList.contains("dark")
        ctx.clearRect(0, 0, W, H)

        // columna → color del segmento al que pertenece
        const bounds: { end: number; c: [number, number, number] }[] = []
        let acc = 0
        for (const s of segs) { acc += Math.max(0, s.value); bounds.push({ end: acc * cols, c: rgb(s.color) }) }

        let seg = 0
        for (let i = 0; i < cols; i++) {
          const px = i * CELL + CELL / 2
          const near = mx > -9000 ? Math.max(0, 1 - Math.abs(px - mx) / 34) : 0
          while (seg < bounds.length - 1 && i >= bounds[seg].end) seg++
          for (let j = 0; j < rows; j++) {
            const n = hash(i, j, tick)
            let r: number, g: number, b: number, a: number
            if (i < edge) {
              ;[r, g, b] = bounds[seg]?.c ?? [118, 185, 0]
              const pulse = Math.exp(-((i - runner) ** 2) / 8)
              r = r + (255 - r) * pulse * 0.45; g = g + (255 - g) * pulse * 0.45; b = b + (255 - b) * pulse * 0.45
              a = 0.72 + 0.2 * Math.sin(i * 0.3 - t * 4) + n * 0.08 + near * 0.3 + pulse * 0.3
            } else if (i === edge && litCols > 0.01) {
              // borde de avance: chispea más claro
              ;[r, g, b] = bounds[seg]?.c ?? [118, 185, 0]
              r = r + (255 - r) * 0.5; g = g + (255 - g) * 0.5; b = b + (255 - b) * 0.5
              a = (litCols - edge) * 0.6 + (n > 0.5 ? 0.5 : 0.2)
            } else {
              // celdas vacías: la rejilla del fondo, con algún parpadeo
              ;[r, g, b] = dark ? [255, 255, 255] : [0, 0, 0]
              a = 0.05 + (n > 0.93 ? 0.07 : 0) + near * 0.12
            }
            ctx.fillStyle = `rgba(${r | 0},${g | 0},${b | 0},${Math.min(1, a)})`
            ctx.fillRect(i * CELL, j * CELL, SQ, SQ)
          }
        }
      }
      if (!reduce) raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect(); io.disconnect(); themeObs.disconnect()
      window.removeEventListener("pointermove", onMove)
      canvas.remove(); probe.remove()
    }
  }, [rows])

  return (
    <div ref={hostRef} role="img" aria-label={label} className={cn("relative w-full", className)} style={{ height: rows * CELL - (CELL - SQ) }} />
  )
}
