import { useEffect, useRef } from "react"

/**
 * El Oráculo: una IA hecha de pixeles que habita detrás del tab activo.
 * Orbe con anillo de arcos de luz girando, aura que chispea, satélites en órbita,
 * visor de ojos rasgados que sigue al cursor y parpadea, fallos de señal ocasionales.
 * Al cambiar de tab no se desliza: se desintegra y se reensambla en el nuevo.
 */

const CELL = 4
const SQ = 3

interface Bit { x: number; y: number; sx: number; sy: number; tx: number; ty: number; delay: number; cyan: boolean }

const hash = (i: number, j: number, s: number) => {
  const h = Math.sin(i * 127.1 + j * 311.7 + s * 74.7) * 43758.5453
  return h - Math.floor(h)
}
const ease = (x: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3)

export function PixelOracle({ target: el }: { target: HTMLElement | null }) {
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
    let cx = r0 ? r0.x + r0.w / 2 : W / 2, cy = r0 ? r0.y + r0.h / 2 : H / 2
    let assemble = reduce ? 1 : 0 // 0 → 1: el orbe se materializa
    let bits: Bit[] = []
    let rot = 0, rot2 = 0
    let nextBlink = 2.5, blinkT = 0, nextGlitch = 4, glitchT = 0
    let raf = 0, last = performance.now(), t = 0
    const rowShift = new Map<number, number>()

    const orbCells = (ox: number, oy: number, R: number) => {
      const out: [number, number][] = []
      for (let i = Math.floor((ox - R) / CELL); i <= Math.ceil((ox + R) / CELL); i++)
        for (let j = Math.floor((oy - R) / CELL); j <= Math.ceil((oy + R) / CELL); j++) {
          const d = Math.hypot(i * CELL + CELL / 2 - ox, j * CELL + CELL / 2 - oy) / R
          if (Math.abs(d - 1) < CELL / R) out.push([i * CELL, j * CELL])
        }
      return out
    }

    const frame = (now: number) => {
      const dt = Math.min((now - last) / 1000, 1 / 30)
      last = now; t += dt
      if (elRef.current !== measuredEl) {
        const prev = rect
        measure()
        const nt = rect as Rect | null
        if (prev && nt && !reduce) {
          // teletransporte: el anillo actual se desintegra en bits que viajan al nuevo tab
          const R = Math.min(H * 0.42, 27)
          const from = orbCells(cx, cy, R)
          const ncx = nt.x + nt.w / 2, ncy = nt.y + nt.h / 2
          bits = from.map(([x, y]) => {
            const a = Math.random() * Math.PI * 2
            return { x, y, sx: x, sy: y, tx: ncx + Math.cos(a) * R, ty: ncy + Math.sin(a) * R, delay: Math.random() * 0.18, cyan: Math.random() < 0.3 }
          })
          cx = ncx; cy = ncy
          assemble = 0
        }
      }
      const tg = elRef.current ? (rect as Rect | null) : null
      ctx.clearRect(0, 0, W, H)
      if (!tg) { raf = requestAnimationFrame(frame); return }

      cx += (tg.x + tg.w / 2 - cx) * (1 - Math.exp(-10 * dt))
      cy += (tg.y + tg.h / 2 + Math.sin(t * 1.3) * 1.5 - cy) * (1 - Math.exp(-10 * dt))
      const near = mx > -9000 ? Math.max(0, 1 - Math.hypot(mx - cx, my - cy) / 120) : 0
      const breathe = 1 + Math.sin(t * 1.8) * 0.035
      const R = Math.min(H * 0.42, 27) * breathe
      rot += dt * (1.1 + near * 3)
      rot2 -= dt * (0.6 + near * 1.5)
      const bitsDone = bits.length === 0
      if (bitsDone || t > 0) assemble = Math.min(1, assemble + dt / (bits.length ? 0.55 : 0.9))

      // fallo de señal: filas desplazadas un instante
      nextGlitch -= dt
      if (!reduce && nextGlitch <= 0) { glitchT = 0.12; nextGlitch = 3 + Math.random() * 5; rowShift.clear() }
      glitchT = Math.max(0, glitchT - dt)
      const shift = (j: number) => {
        if (glitchT <= 0) return 0
        let s = rowShift.get(j)
        if (s === undefined) { s = hash(j, 7, t) > 0.75 ? (hash(j, 3, 1) - 0.5) * 16 : 0; rowShift.set(j, s) }
        return s
      }

      // ── bits en tránsito ──
      for (let b = bits.length - 1; b >= 0; b--) {
        const p = bits[b]
        const k = ease((assemble * 0.55 - p.delay) / 0.4)
        p.x = p.sx + (p.tx - p.sx) * k
        p.y = p.sy + (p.ty - p.sy) * k - Math.sin(k * Math.PI) * 10
        if (k >= 1) { bits.splice(b, 1); continue }
        ctx.fillStyle = p.cyan ? "rgba(60,196,216,0.95)" : "rgba(182,240,58,0.95)"
        ctx.fillRect(Math.round(p.x / CELL) * CELL, Math.round(p.y / CELL) * CELL, SQ, SQ)
      }

      // ── orbe ──
      const tick = Math.floor(t * 10)
      const Rout = R * 1.45
      for (let i = Math.floor((cx - Rout) / CELL); i <= Math.ceil((cx + Rout) / CELL); i++) {
        for (let j = Math.floor((cy - Rout) / CELL); j <= Math.ceil((cy + Rout) / CELL); j++) {
          const px = i * CELL + CELL / 2, py = j * CELL + CELL / 2
          const dx = px - cx, dy = py - cy
          const d = Math.hypot(dx, dy) / R
          if (d > 1.45) continue
          const n = hash(i, j, tick)
          if (assemble < 1 && hash(i, j, 2) > assemble) continue
          const ang = Math.atan2(dy, dx)
          let r = 118, g = 185, b = 0, a: number
          if (Math.abs(d - 1) < CELL / R) {
            // anillo con dos arcos de luz girando en sentidos opuestos
            const d1 = ((ang - rot) % (Math.PI * 2) + Math.PI * 3) % (Math.PI * 2) - Math.PI
            const d2 = ((ang - rot2) % (Math.PI * 2) + Math.PI * 3) % (Math.PI * 2) - Math.PI
            const s1 = Math.exp(-(d1 * d1) / 0.35)
            const s2 = Math.exp(-(d2 * d2) / 0.2)
            a = 0.35 + s1 * 0.65 + near * 0.2
            const w = Math.max(s1, s2 * 0.8)
            r += (230 - r) * w * 0.6; g += (255 - g) * w * 0.6; b += (200 - b) * w * 0.4
            if (s2 > 0.4) { r = 60; g = 196; b = 216; a = 0.9 }
          } else if (d < 1) {
            // interior: plasma tenue con ondas concéntricas (deja leer el texto)
            const wave = 0.5 + 0.5 * Math.sin(d * 9 - t * 3)
            a = 0.05 + wave * 0.07 + (n > 0.96 ? 0.12 : 0)
          } else {
            // aura exterior que chispea
            if (n > (1.45 - d) * 0.9 + near * 0.25) continue
            a = 0.18 + n * 0.25
          }
          ctx.fillStyle = `rgba(${r | 0},${g | 0},${b | 0},${Math.min(1, a)})`
          ctx.fillRect(i * CELL + shift(j), j * CELL, SQ, SQ)
        }
      }

      // ── satélites en órbita ──
      for (let s = 0; s < 3; s++) {
        const a = t * (0.9 + s * 0.45) + s * 2.1
        const rr = R * (1.25 + s * 0.08)
        const sx = cx + Math.cos(a) * rr, sy = cy + Math.sin(a) * rr * 0.55
        ctx.fillStyle = s === 1 ? `rgba(60,196,216,${assemble})` : `rgba(182,240,58,${assemble * 0.9})`
        ctx.fillRect(Math.round(sx / CELL) * CELL, Math.round(sy / CELL) * CELL, SQ, SQ)
      }

      // ── visor: ojos rasgados en la parte alta del anillo ──
      nextBlink -= dt
      if (nextBlink <= 0) { blinkT = 0.13; nextBlink = 2 + Math.random() * 4.5 }
      blinkT = Math.max(0, blinkT - dt)
      const lookX = mx > -9000 ? Math.max(-1, Math.min(1, (mx - cx) / 160)) : Math.sin(t * 0.5) * 0.6
      const lookY = my > -9000 ? Math.max(-1, Math.min(1, (my - cy) / 90)) : 0
      const ey = Math.round((cy - R * 0.7 + lookY * 2) / CELL) * CELL
      const tall = blinkT > 0 ? 1 : near > 0.5 ? CELL * 2 - 1 : SQ
      for (const side of [-1, 1]) {
        const ex = Math.round((cx + side * CELL * 2.5 + lookX * 4) / CELL) * CELL
        ctx.fillStyle = `rgba(0,0,0,${0.85 * assemble})`
        ctx.fillRect(ex - CELL * 1.5 - 1, ey - 2, CELL * 3 + 2, tall + 4)
        ctx.fillStyle = `rgba(150,240,255,${assemble})`
        ctx.fillRect(ex - CELL * 1.5, ey + (SQ - Math.min(tall, SQ)) / 2, CELL * 3 - 1, tall)
      }

      if (!reduce || assemble < 1) raf = requestAnimationFrame(frame)
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

  return <div ref={hostRef} aria-hidden className="pointer-events-none absolute inset-x-[-55px] inset-y-0" />
}
