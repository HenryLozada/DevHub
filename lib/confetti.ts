// Tiny dependency-free confetti burst on a temporary full-screen canvas
const COLORS = ["#76b900", "#b6f03a", "#5eead4", "#facc15", "#f472b6", "#a78bfa"]

interface Piece {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  rot: number
  vr: number
  color: string
  shape: "rect" | "circle"
}

// Remember where the user last tapped so a burst can start from the button they pressed
let lastPointer: { x: number; y: number; at: number } | null = null
if (typeof window !== "undefined") {
  window.addEventListener("pointerdown", (e) => { lastPointer = { x: e.clientX, y: e.clientY, at: Date.now() } }, { capture: true, passive: true })
}

/** Bursts confetti from a point (defaults to the last tap, else the screen center). No-op with reduced motion. */
export function confetti(origin?: { x: number; y: number }, count = 70) {
  if (typeof window === "undefined") return
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return

  const canvas = document.createElement("canvas")
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  canvas.width = window.innerWidth * dpr
  canvas.height = window.innerHeight * dpr
  Object.assign(canvas.style, { position: "fixed", inset: "0", width: "100%", height: "100%", pointerEvents: "none", zIndex: "9999" })
  document.body.appendChild(canvas)
  const ctx = canvas.getContext("2d")
  if (!ctx) return canvas.remove()
  ctx.scale(dpr, dpr)

  const recent = lastPointer && Date.now() - lastPointer.at < 1500 ? lastPointer : null
  const ox = origin?.x ?? recent?.x ?? window.innerWidth / 2
  const oy = origin?.y ?? recent?.y ?? window.innerHeight / 2
  const pieces: Piece[] = Array.from({ length: count }, () => {
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 0.9
    const speed = 6 + Math.random() * 7
    return {
      x: ox,
      y: oy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: 5 + Math.random() * 5,
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.3,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      shape: Math.random() > 0.35 ? "rect" : "circle",
    }
  })

  const start = performance.now()
  const DURATION = 1600
  const frame = (t: number) => {
    const elapsed = t - start
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight)
    ctx.globalAlpha = Math.max(0, 1 - elapsed / DURATION)
    for (const p of pieces) {
      p.vy += 0.28
      p.vx *= 0.985
      p.x += p.vx
      p.y += p.vy
      p.rot += p.vr
      ctx.save()
      ctx.translate(p.x, p.y)
      ctx.rotate(p.rot)
      ctx.fillStyle = p.color
      if (p.shape === "rect") ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2)
      else {
        ctx.beginPath()
        ctx.arc(0, 0, p.size / 3, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.restore()
    }
    if (elapsed < DURATION) requestAnimationFrame(frame)
    else canvas.remove()
  }
  requestAnimationFrame(frame)
}

/** Confetti from the center of the element that triggered an event. */
export function confettiFrom(el: Element | null | undefined) {
  const r = el?.getBoundingClientRect()
  confetti(r ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : undefined)
}
