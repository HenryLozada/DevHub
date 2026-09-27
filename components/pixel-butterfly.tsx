import { useEffect, useRef } from "react"

/**
 * Mariposa de pixeles (la oruga de pixel-entity.tsx, ya transformada).
 * Alas angulares de vidrio con circuitos de luz, estética neo-noir: nace pixel a pixel,
 * aletea en reposo, vuela al tab activo dejando polvo de luz y mira al cursor.
 */

const CELL = 4
const SQ = 3
const MAX_DUST = 70

type P = [number, number]
// Alas en coordenadas normalizadas: u = 0 (cuerpo) → 1 (punta), v = -1 (arriba) → 1 (abajo)
const UPPER: P[] = [[0, -0.12], [0.3, -0.8], [0.72, -1], [1, -0.78], [0.9, -0.34], [0.46, 0.02]]
const LOWER: P[] = [[0, 0.06], [0.48, 0.1], [0.72, 0.42], [0.6, 0.86], [0.3, 0.98], [0.06, 0.46]]

const inPoly = (x: number, y: number, poly: P[]) => {
  let inside = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j]
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside
  }
  return inside
}
const inWing = (u: number, v: number) => u >= 0 && (inPoly(u, v, UPPER) || inPoly(u, v, LOWER))

const hash = (i: number, j: number, s: number) => {
  const h = Math.sin(i * 127.1 + j * 311.7 + s * 74.7) * 43758.5453
  return h - Math.floor(h)
}

interface Dust { x: number; y: number; vx: number; vy: number; life: number; cyan: boolean }

export function PixelButterfly({ target: el }: { target: HTMLElement | null }) {
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
    let bx = r0 ? r0.x + r0.w / 2 : W / 2, by = H / 2, vx = 0, vy = 0
    let span = r0 ? r0.w * 0.6 : 60 // envergadura de un ala (px)
    let phase = 0, born = reduce ? 1 : 0
    const dust: Dust[] = []
    let nextBlink = 3, blinkT = 0
    let raf = 0, last = performance.now(), t = 0

    const frame = (now: number) => {
      const dt = Math.min((now - last) / 1000, 1 / 30)
      last = now; t += dt
      if (elRef.current !== measuredEl) measure()
      const tg = elRef.current ? (rect as Rect | null) : null
      ctx.clearRect(0, 0, W, H)
      if (!tg) { raf = requestAnimationFrame(frame); return }
      born = Math.min(1, born + dt / 1.4)

      // ── vuelo: muelle hacia el tab, tímida si el cursor se acerca ──
      const tx = tg.x + tg.w / 2, ty = tg.y + tg.h / 2 + Math.sin(t * 1.6) * 2
      vx += (tx - bx) * 38 * dt; vy += (ty - by) * 50 * dt
      const cdx = bx - mx, cdy = by - my, cd = Math.hypot(cdx, cdy)
      if (cd < 55) { vx += (cdx / (cd + 1)) * 220 * dt; vy += (cdy / (cd + 1)) * 160 * dt }
      vx *= Math.exp(-5.5 * dt); vy *= Math.exp(-6.5 * dt)
      bx += vx * dt; by += vy * dt
      span += (tg.w * 0.6 - span) * (1 - Math.exp(-4 * dt))
      const speed = Math.hypot(vx, vy)
      // aleteo: lento en reposo, rápido al volar o si el cursor la asusta
      phase += dt * (2.4 + Math.min(speed / 25, 14) + (cd < 55 ? 8 : 0))
      const open = 0.22 + 0.78 * Math.abs(Math.cos(phase)) // apertura aparente de las alas
      const hWing = Math.min(H * 0.44, 28)

      // ── polvo de luz de las alas ──
      if (!reduce && dust.length < MAX_DUST && Math.random() < dt * (speed > 60 ? 45 : 2.5)) {
        const side = Math.random() < 0.5 ? -1 : 1
        dust.push({ x: bx + side * span * open * (0.5 + Math.random() * 0.5), y: by + (Math.random() - 0.5) * hWing, vx: -vx * 0.15 + (Math.random() - 0.5) * 20, vy: 8 + Math.random() * 16, life: 1, cyan: Math.random() < 0.45 })
      }
      for (let d = dust.length - 1; d >= 0; d--) {
        const p = dust[d]
        p.vy += 10 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt * 0.8
        if (p.life <= 0 || p.y > H) { dust.splice(d, 1); continue }
        ctx.fillStyle = p.cyan ? `rgba(60,196,216,${p.life * 0.9})` : `rgba(182,240,58,${p.life * 0.9})`
        ctx.fillRect(Math.round(p.x / CELL) * CELL, Math.round(p.y / CELL) * CELL, SQ - 1, SQ - 1)
      }

      // ── alas: rasterizar en la rejilla ──
      const tick = Math.floor(t * 10)
      const reach = span * open
      const i0 = Math.floor((bx - reach - CELL) / CELL), i1 = Math.ceil((bx + reach + CELL) / CELL)
      const j0 = Math.floor((by - hWing - CELL) / CELL), j1 = Math.ceil((by + hWing + CELL) / CELL)
      const du = CELL / Math.max(reach, 1), dv = CELL / hWing
      for (let i = i0; i <= i1; i++) {
        const px = i * CELL + CELL / 2
        const side = px < bx ? -1 : 1
        const u = (Math.abs(px - bx) - 1.5) / Math.max(reach, 1)
        for (let j = j0; j <= j1; j++) {
          const py = j * CELL + CELL / 2
          const v = (py - by) / hWing
          if (!inWing(u, v)) continue
          const n = hash(i * side, j, tick)
          if (born < 1 && hash(i, j, 1) > born) continue // nace pixel a pixel
          const edge = !inWing(u + du, v) || !inWing(u, v - dv) || !inWing(u, v + dv) || !inWing(u - du * 0.5, v)
          // degradado lima → cian hacia las puntas
          const k = Math.min(1, u * 1.1)
          let r = 118 + (60 - 118) * k, g = 185 + (196 - 185) * k, b = 0 + 216 * k
          let a = 0.32 + n * 0.08
          // venas de circuito que irradian desde el cuerpo
          const ang = Math.atan2(v, u) * 2.2
          const vein = Math.abs(ang - Math.round(ang)) < 0.07 && u > 0.12
          // ocelos en las alas superiores
          const eye = Math.hypot(u - 0.66, v + 0.62)
          if (eye < 0.1) { r = 230; g = 255; b = 200; a = 0.95 }
          else if (eye < 0.17) { r = 60; g = 196; b = 216; a = 0.85 }
          else if (edge) { r += (255 - r) * 0.35; g += (255 - g) * 0.35; b += (255 - b) * 0.35; a = 0.92 }
          else if (vein) a = 0.75
          a *= 0.85 + 0.15 * Math.sin(u * 9 - t * 3) // pulso que viaja por el ala
          ctx.fillStyle = `rgba(${r | 0},${g | 0},${b | 0},${Math.min(1, a)})`
          ctx.fillRect(i * CELL, j * CELL, SQ, SQ)
        }
      }

      // ── cuerpo, cabeza, antenas y ojos ──
      const cx = Math.round(bx / CELL) * CELL
      const alpha = born
      ctx.fillStyle = `rgba(10,14,4,${0.9 * alpha})`
      for (let y = by - hWing * 0.55; y <= by + hWing * 0.7; y += CELL) ctx.fillRect(cx, Math.round(y / CELL) * CELL, SQ, SQ)
      ctx.fillStyle = `rgba(182,240,58,${0.9 * alpha})`
      for (let y = by - hWing * 0.3; y <= by + hWing * 0.6; y += CELL * 2) ctx.fillRect(cx, Math.round(y / CELL) * CELL, SQ, 1)
      // antenas que se mecen
      const headY = by - hWing * 0.62
      for (const s of [-1, 1]) {
        for (let k = 1; k <= 4; k++) {
          const ax = cx + s * k * CELL * 0.8 + Math.sin(t * 2 + s) * k * 0.4
          const ay = headY - k * CELL * 0.9
          ctx.fillStyle = k === 4 ? `rgba(60,196,216,${alpha})` : `rgba(182,240,58,${0.7 * alpha})`
          ctx.fillRect(Math.round(ax / CELL) * CELL, Math.round(ay / CELL) * CELL, k === 4 ? SQ : 2, k === 4 ? SQ : 2)
        }
      }
      nextBlink -= dt
      if (nextBlink <= 0) { blinkT = 0.12; nextBlink = 2.5 + Math.random() * 4 }
      blinkT = Math.max(0, blinkT - dt)
      const look = mx > -9000 ? Math.sign(mx - bx) : 0
      if (blinkT <= 0) {
        ctx.fillStyle = `rgba(230,255,190,${alpha})`
        ctx.fillRect(cx - CELL + (look > 0 ? 1 : 0), Math.round(headY / CELL) * CELL, 2, 2)
        ctx.fillRect(cx + CELL + (look < 0 ? -1 : 0), Math.round(headY / CELL) * CELL, 2, 2)
      }

      if (!reduce || born < 1) raf = requestAnimationFrame(frame)
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

  return <div ref={hostRef} aria-hidden className="pointer-events-none absolute inset-x-[-55px] -inset-y-f3" />
}
