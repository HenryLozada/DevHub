import { useEffect, useRef } from "react"

/**
 * Entidad de pixeles: una criatura hecha de la misma rejilla que el fondo del login.
 * Vive detrás del tab activo, viaja hacia él con muelles, se estira, respira,
 * suelta esporas cuando corre, parpadea y mira al cursor.
 */

const CELL = 5 // paso de la rejilla (px)
const SQ = 4 // tamaño del pixel (núcleo casi sólido para que el texto se lea)
const CORE = 7 // bolas que forman el cuerpo
const MAX_SPORES = 55

interface Ball { x: number; y: number; vx: number; vy: number; r: number; ox: number; k: number }
interface Spore { x: number; y: number; vx: number; vy: number; life: number }

// hash determinista por celda → parpadeo orgánico sin guardar estado
const hash = (i: number, j: number, s: number) => {
  const h = Math.sin(i * 127.1 + j * 311.7 + s * 74.7) * 43758.5453
  return h - Math.floor(h)
}

export function PixelEntity({ target: el }: { target: HTMLElement | null }) {
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

    const r0 = rect as Rect | null
    const balls: Ball[] = Array.from({ length: CORE }, (_, i) => {
      const ox = i / (CORE - 1) - 0.5
      return { x: r0 ? r0.x + r0.w / 2 + ox * r0.w * 0.8 : W / 2, y: r0 ? r0.y + r0.h / 2 : H / 2, vx: 0, vy: 0, r: 12, ox, k: 70 + (i % 2) * 35 - Math.abs(ox) * 40 }
    })
    // cabeza: un bulto arriba a la derecha que sigue al cuerpo con algo de retraso
    balls.push({ x: balls[CORE - 1].x, y: balls[CORE - 1].y, vx: 0, vy: 0, r: 8, ox: 0, k: 45 })
    const head = balls[CORE]
    const spores: Spore[] = []

    let mx = -9999, my = -9999
    const onMove = (e: PointerEvent) => {
      const r = host.getBoundingClientRect()
      mx = e.clientX - r.left; my = e.clientY - r.top
    }
    window.addEventListener("pointermove", onMove, { passive: true })

    let excite = 0 // se agita al cambiar de tab
    let nextBlink = 2 + Math.random() * 3, blinkT = 0
    let raf = 0, last = performance.now(), t = 0

    const frame = (now: number) => {
      const dt = Math.min((now - last) / 1000, 1 / 30)
      last = now; t += dt
      if (elRef.current !== measuredEl) {
        if (measuredEl) ro.unobserve(measuredEl)
        measure()
        if (measuredEl) ro.observe(measuredEl)
        excite = 1
      }
      const tg = elRef.current ? (rect as Rect | null) : null
      ctx.clearRect(0, 0, W, H)
      if (!tg) { raf = requestAnimationFrame(frame); return }

      const cx = tg.x + tg.w / 2, cy = tg.y + tg.h / 2
      const breathe = 1 + Math.sin(t * 2.1) * 0.05
      excite = Math.max(0, excite - dt * 1.2)

      // ── cuerpo: muelles hacia el tab, curiosidad hacia el cursor ──
      let speed = 0
      for (let i = 0; i < balls.length; i++) {
        const b = balls[i]
        const isHead = b === head
        const tx = isHead ? cx + tg.w * 0.3 : cx + b.ox * tg.w * 0.8
        const ty = isHead ? cy - tg.h * 0.42 + Math.sin(t * 2.1) * 1.2 : cy + Math.sin(t * 3 + i * 0.9) * 1.5
        b.vx += (tx - b.x) * b.k * dt
        b.vy += (ty - b.y) * b.k * 1.3 * dt
        const dx = mx - b.x, dy = my - b.y, d2 = dx * dx + dy * dy
        if (d2 < 90 * 90) { const f = (1 - Math.sqrt(d2) / 90) * 260 * dt; b.vx += dx * f * 0.02; b.vy += dy * f * 0.02 }
        b.vx *= Math.exp(-6.5 * dt); b.vy *= Math.exp(-8 * dt)
        b.x += b.vx * dt; b.y += b.vy * dt
        b.r = isHead ? tg.h * 0.3 * breathe : tg.h * 0.44 * breathe * (1 - Math.abs(b.ox) * 0.3) * (1 + Math.min(Math.abs(b.vx) / 3000, 0.2))
        speed = Math.max(speed, Math.abs(b.vx))
        // esporas: se desprenden al correr, y de vez en cuando al respirar
        if (spores.length < MAX_SPORES && (speed > 500 ? Math.random() < dt * 30 : Math.random() < dt * 0.5)) {
          spores.push({ x: b.x - Math.sign(b.vx) * b.r * 0.6, y: b.y + (Math.random() - 0.5) * b.r, vx: -b.vx * 0.12 + (Math.random() - 0.5) * 40, vy: -10 - Math.random() * 30, life: 1 })
        }
      }

      // ── rasterizar el campo en la rejilla de pixeles ──
      let minX = Infinity, maxX = -Infinity
      for (const b of balls) { minX = Math.min(minX, b.x - b.r * 2.2); maxX = Math.max(maxX, b.x + b.r * 2.2) }
      const i0 = Math.max(0, Math.floor(minX / CELL)), i1 = Math.min(Math.ceil(W / CELL), Math.ceil(maxX / CELL))
      const j1 = Math.ceil(H / CELL)
      const tick = Math.floor(t * 12)
      const wave = t * 5
      for (let i = i0; i < i1; i++) {
        const px = i * CELL + CELL / 2
        for (let j = 0; j < j1; j++) {
          const py = j * CELL + CELL / 2
          let f = 0
          for (const b of balls) { const dx = px - b.x, dy = py - b.y; f += (b.r * b.r) / (dx * dx + dy * dy + 1) }
          f /= CORE * 0.34
          if (f < 0.62) continue
          const n = hash(i, j, tick)
          let a: number
          if (f < 1) {
            // membrana viva: pixeles sueltos que chispean alrededor del cuerpo
            if (n > (f - 0.62) * 1.6 + excite * 0.35) continue
            a = 0.2 + n * 0.3
          } else {
            a = Math.min(1, 0.8 + (f - 1) * 0.3) * (0.88 + 0.12 * Math.sin(px * 0.06 - wave)) * (0.94 + n * 0.06)
          }
          const hot = Math.min(1, (f - 1) * 0.5 + excite * 0.4)
          const g = Math.round(185 + 55 * hot), rr = Math.round(118 + 70 * hot)
          ctx.fillStyle = `rgba(${rr},${g},${Math.round(20 * hot)},${a})`
          const sq = f < 1 ? SQ - 1 : f > 1.5 ? CELL - 0.5 : SQ
          ctx.fillRect(i * CELL + (CELL - sq) / 2, j * CELL + (CELL - sq) / 2, sq, sq)
        }
      }

      // ── esporas ──
      for (let s = spores.length - 1; s >= 0; s--) {
        const p = spores[s]
        p.vy -= 12 * dt; p.vx *= Math.exp(-2 * dt)
        p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt * 0.9
        if (p.life <= 0 || p.y < -CELL) { spores.splice(s, 1); continue }
        ctx.fillStyle = `rgba(155,224,28,${p.life * 0.8})`
        ctx.fillRect(Math.round(p.x / CELL) * CELL + 1, Math.round(p.y / CELL) * CELL + 1, SQ, SQ)
      }

      // ── ojos: miran al cursor y parpadean ──
      nextBlink -= dt
      if (nextBlink <= 0) { blinkT = 0.14; nextBlink = 2.5 + Math.random() * 4 }
      blinkT = Math.max(0, blinkT - dt)
      const ex = head.x, ey = head.y
      const lookX = mx > -9000 ? Math.max(-1, Math.min(1, (mx - ex) / 150)) : Math.sin(t * 0.7) * 0.5
      const lookY = my > -9000 ? Math.max(-1, Math.min(1, (my - ey) / 80)) : 0
      const eyeY = ey - 1 + lookY * 2
      // ojos de 2×2 pixeles en la cabeza
      for (const side of [-1, 1]) {
        const x = Math.round((ex + side * 6 + lookX * 3) / CELL) * CELL
        const y = Math.round(eyeY / CELL) * CELL
        const h = blinkT > 0 ? 2 : CELL * 2 - 1
        ctx.fillStyle = "rgba(4,8,0,0.95)"
        ctx.fillRect(x - CELL, y - CELL + (CELL * 2 - 1 - h) / 2, CELL * 2 - 1, h)
        if (blinkT <= 0) {
          ctx.fillStyle = "rgba(230,255,170,0.9)" // brillo en la pupila
          ctx.fillRect(x - CELL + (lookX > 0 ? CELL : 1), y - CELL + 1, 2, 2)
        }
      }

      raf = requestAnimationFrame(frame)
    }
    if (reduce) { frame(performance.now()); cancelAnimationFrame(raf) } else raf = requestAnimationFrame(frame)

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
