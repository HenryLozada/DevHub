import { useEffect, useRef } from "react"

/**
 * Pulse: un enjambre de pixeles sujeto por un campo magnético alrededor del tab activo.
 * Las partículas dibujan líneas de campo que fluyen; cada cierto tiempo el campo late
 * (salen, brillan y vuelven de golpe). Al cambiar de tab, el campo las arrastra.
 */

const CELL = 3
const SQ = 2
const N = 84
const LEVELS = 3

interface Bit { x: number; y: number; vx: number; vy: number; s: number; level: number; k: number }

export function PixelPulse({ target: el }: { target: HTMLElement | null }) {
  const hostRef = useRef<HTMLDivElement>(null)
  const elRef = useRef(el)
  elRef.current = el

  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    canvas.style.cssText = "position:absolute;inset:0;width:100%;height:100%;pointer-events:none"
    host.appendChild(canvas)
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches

    let W = 0, H = 0
    type Rect = { x: number; y: number; w: number; h: number }
    let rect = null as Rect | null
    let measuredEl: HTMLElement | null = null
    const measure = () => {
      const e = elRef.current
      if (!e) return
      const a = e.getBoundingClientRect(), h = host.getBoundingClientRect()
      measuredEl = e
      rect = { x: a.left - h.left, y: a.top - h.top, w: a.width, h: a.height }
    }
    const resize = () => {
      W = host.clientWidth; H = host.clientHeight
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      measure()
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(host)
    window.addEventListener("resize", resize)

    let mx = -9999, my = -9999
    const onMove = (e: PointerEvent) => {
      const r = host.getBoundingClientRect()
      mx = e.clientX - r.left; my = e.clientY - r.top
    }
    window.addEventListener("pointermove", onMove, { passive: true })

    const r0 = rect as Rect | null
    const bits: Bit[] = Array.from({ length: N }, (_, i) => ({
      x: r0 ? r0.x + r0.w / 2 : W / 2, y: H / 2, vx: 0, vy: 0,
      s: (i / N) * Math.PI * 2 * 3 + Math.random() * 0.3, // posición sobre la línea de campo
      level: i % LEVELS,
      k: 160 + Math.random() * 90, // cada partícula responde al campo a su ritmo
    }))

    let pulseAge = 99, nextPulse = 0.6
    let raf = 0, last = performance.now(), t = 0

    // dónde "quiere" estar cada partícula: órbitas elípticas que rodean el tab (líneas de campo)
    const home = (b: Bit, tg: Rect, push: number) => {
      const rx = tg.w / 2 + 5 + b.level * 5 + push
      const ry = tg.h / 2 + 2 + b.level * 3.5 + push * 0.5
      return [tg.x + tg.w / 2 + Math.cos(b.s) * rx, tg.y + tg.h / 2 + Math.sin(b.s) * ry] as const
    }

    const frame = (now: number) => {
      const dt = Math.min((now - last) / 1000, 1 / 30)
      last = now; t += dt
      if (elRef.current !== measuredEl) { measure(); pulseAge = 0.35 } // el salto también late
      const tg = elRef.current ? (rect as Rect | null) : null
      ctx.clearRect(0, 0, W, H)
      if (!tg) { raf = requestAnimationFrame(frame); return }

      // latido magnético
      nextPulse -= dt; pulseAge += dt
      if (nextPulse <= 0) { pulseAge = 0; nextPulse = 2.2 + Math.random() * 0.8 }

      for (const b of bits) {
        // el campo fluye: cada órbita en sentido alterno
        b.s += dt * (0.35 + b.level * 0.12) * (b.level % 2 ? -1 : 1)
        // onda de pulso: sale por niveles (primero el interior)
        const age = pulseAge - b.level * 0.06
        const push = age > 0 ? Math.exp(-age * 5) * Math.sin(Math.min(age * 14, Math.PI)) * 9 : 0
        const [hx, hy] = home(b, tg, push)
        b.vx += (hx - b.x) * b.k * dt
        b.vy += (hy - b.y) * b.k * dt
        // el cursor deforma el campo
        const dx = b.x - mx, dy = b.y - my, d2 = dx * dx + dy * dy
        if (d2 < 1600) { const d = Math.sqrt(d2) + 1, f = (1 - d / 40) * 900 * dt; b.vx += (dx / d) * f; b.vy += (dy / d) * f }
        b.vx *= Math.exp(-11 * dt); b.vy *= Math.exp(-11 * dt)
        b.x += b.vx * dt; b.y += b.vy * dt

        const glow = age > 0 ? Math.exp(-age * 4) : 0
        const speed = Math.min(1, Math.hypot(b.vx, b.vy) / 400)
        const a = 0.5 - b.level * 0.1 + glow * 0.5 + speed * 0.4
        const hot = Math.max(glow, speed)
        ctx.fillStyle = `rgba(${(118 + 90 * hot) | 0},${(185 + 60 * hot) | 0},${(60 * hot) | 0},${Math.min(1, a)})`
        ctx.fillRect(Math.round(b.x / CELL) * CELL, Math.round(b.y / CELL) * CELL, SQ, SQ)
      }

      if (!reduce) raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      window.removeEventListener("resize", resize)
      window.removeEventListener("pointermove", onMove)
      canvas.remove()
    }
  }, [])

  return <div ref={hostRef} aria-hidden className="pointer-events-none absolute inset-x-[-34px] inset-y-0" />
}
