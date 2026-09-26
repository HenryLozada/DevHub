import { useEffect, useRef } from "react"
import * as THREE from "three"

const MAX_BALLS = 32
const CORE = 7

interface Ball {
  x: number
  y: number
  vx: number
  vy: number
  r: number
  k: number // rigidez del muelle (0 = gota libre)
  ox: number // offset objetivo dentro de la píldora
  life: number
}

const frag = /* glsl */ `
precision highp float;
uniform vec2 uRes;
uniform float uTime;
uniform vec3 uBalls[${MAX_BALLS}];
uniform int uCount;

float field(vec2 p) {
  float f = 0.0;
  for (int i = 0; i < ${MAX_BALLS}; i++) {
    if (i >= uCount) break;
    vec3 b = uBalls[i];
    vec2 d = p - b.xy;
    f += (b.z * b.z) / (dot(d, d) + 1.0);
  }
  return f;
}

void main() {
  vec2 p = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y);
  float f = field(p);
  float th = 1.0;
  float e = 1.5;
  vec2 g = vec2(field(p + vec2(e, 0.0)) - field(p - vec2(e, 0.0)),
                field(p + vec2(0.0, e)) - field(p - vec2(0.0, e)));
  vec3 n = normalize(vec3(-g * 6.0, 1.0));
  n.y = -n.y;
  float wob = sin(p.x * 0.08 + uTime * 3.0) * 0.05 + sin(p.y * 0.2 - uTime * 2.0) * 0.05;
  vec3 L = normalize(vec3(-0.4, 0.7, 0.9));
  float diff = clamp(dot(n, L), 0.0, 1.0);
  float spec = pow(clamp(dot(reflect(-L, n), vec3(0.0, 0.0, 1.0)), 0.0, 1.0), 40.0);
  float rim = pow(1.0 - n.z, 2.0);
  vec3 deep = vec3(0.24, 0.52, 0.0);
  vec3 lime = vec3(0.61, 0.88, 0.11);
  vec3 col = mix(deep, lime, diff + wob) + spec * 1.2 + rim * vec3(0.7, 1.0, 0.2) * 0.4;
  float a = smoothstep(th - 0.08, th + 0.08, f);
  float glow = smoothstep(0.25, th, f) * (1.0 - a) * 0.45;
  gl_FragColor = vec4(col * a + vec3(0.46, 0.73, 0.0) * glow, a + glow);
}
`

/** Píldora de slime con metaballs: sigue al tab activo con muelles, se estira y gotea. */
export function SlimeNav({ target: el }: { target: HTMLElement | null }) {
  const hostRef = useRef<HTMLDivElement>(null)
  const elRef = useRef(el)
  elRef.current = el

  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false, premultipliedAlpha: false })
    const dpr = Math.min(window.devicePixelRatio, 2)
    renderer.setPixelRatio(dpr)
    renderer.domElement.style.cssText = "position:absolute;inset:0;width:100%;height:100%;pointer-events:none"
    host.appendChild(renderer.domElement)

    const uBalls = Array.from({ length: MAX_BALLS }, () => new THREE.Vector3())
    const mat = new THREE.ShaderMaterial({
      fragmentShader: frag,
      vertexShader: "void main(){gl_Position=vec4(position.xy,0.,1.);}",
      uniforms: { uRes: { value: new THREE.Vector2() }, uTime: { value: 0 }, uBalls: { value: uBalls }, uCount: { value: 0 } },
      transparent: true,
    })
    const scene = new THREE.Scene()
    scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat))
    const cam = new THREE.Camera()

    let W = 0, H = 0
    const resize = () => {
      W = host.clientWidth; H = host.clientHeight
      renderer.setSize(W, H, false)
      mat.uniforms.uRes.value.set(W * dpr, H * dpr)
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(host)

    const measure = () => {
      const e = elRef.current
      if (!e) return null
      const a = e.getBoundingClientRect(), h = host.getBoundingClientRect()
      return { x: a.left - h.left, y: a.top - h.top, w: a.width, h: a.height }
    }
    const balls: Ball[] = []
    const init = measure()
    for (let i = 0; i < CORE; i++) {
      const ox = (i / (CORE - 1) - 0.5)
      const x = init ? init.x + init.w / 2 + ox * init.w * 0.8 : 0
      balls.push({ x, y: init ? init.y + init.h / 2 : H / 2, vx: 0, vy: 0, r: 13, ox, k: 90 + Math.abs(ox) * -80 + (i % 2) * 40, life: 1 })
    }

    let mx = -999, my = -999
    const onMove = (e: PointerEvent) => {
      const r = host.getBoundingClientRect()
      mx = e.clientX - r.left; my = e.clientY - r.top
    }
    const onLeave = () => { mx = my = -999 }
    window.addEventListener("pointermove", onMove)
    host.parentElement?.addEventListener("pointerleave", onLeave)

    let raf = 0, last = performance.now(), t = 0
    const loop = (now: number) => {
      const dt = Math.min((now - last) / 1000, 1 / 30)
      last = now; t += dt
      const tg = measure()
      if (tg) {
        const cx = tg.x + tg.w / 2, cy = tg.y + tg.h / 2
        for (let i = 0; i < balls.length; i++) {
          const b = balls[i]
          if (b.k > 0) {
            const tx = cx + b.ox * tg.w * 0.78
            const ty = cy + Math.sin(t * 4 + i) * 1.2
            b.vx += (tx - b.x) * b.k * dt
            b.vy += (ty - b.y) * b.k * 1.4 * dt
            b.vx *= Math.exp(-7 * dt); b.vy *= Math.exp(-9 * dt)
            b.r = tg.h * 0.42 * (1 + Math.min(Math.abs(b.vx) / 2500, 0.25)) * (1 - Math.abs(b.ox) * 0.25)
            // gotas cuando va rápido
            if (Math.abs(b.vx) > 700 && balls.length < MAX_BALLS && Math.random() < dt * 14) {
              balls.push({ x: b.x, y: b.y + (Math.random() - 0.5) * 10, vx: -b.vx * 0.15 + (Math.random() - 0.5) * 120, vy: (Math.random() - 0.3) * 260, r: 5 + Math.random() * 6, k: 0, ox: 0, life: 1 })
            }
          } else {
            // gota libre: gravedad hacia abajo y se pega al borde inferior
            b.vy += 900 * dt
            b.vx *= Math.exp(-3 * dt)
            b.life -= dt * 0.8
            if (b.y > H - b.r * 0.3) { b.y = H - b.r * 0.3; b.vy *= -0.25; b.vx *= 0.6 }
            b.r *= 1 - dt * 0.9
          }
          // el ratón empuja el slime
          const dx = b.x - mx, dy = b.y - my, d2 = dx * dx + dy * dy
          if (d2 < 1600) { const f = (1600 - d2) / 1600 * 1800 * dt; const d = Math.sqrt(d2) + 1; b.vx += dx / d * f; b.vy += dy / d * f }
          b.x += b.vx * dt; b.y += b.vy * dt
        }
        for (let i = balls.length - 1; i >= CORE; i--) if (balls[i].life <= 0 || balls[i].r < 2) balls.splice(i, 1)
      }
      for (let i = 0; i < MAX_BALLS; i++) {
        const b = balls[i]
        if (b) uBalls[i].set(b.x * dpr, b.y * dpr, b.r * dpr)
      }
      mat.uniforms.uCount.value = tg ? balls.length : 0
      mat.uniforms.uTime.value = t
      renderer.render(scene, cam)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      window.removeEventListener("pointermove", onMove)
      host.parentElement?.removeEventListener("pointerleave", onLeave)
      mat.dispose(); renderer.dispose()
      renderer.domElement.remove()
    }
  }, [])

  return <div ref={hostRef} aria-hidden className="pointer-events-none absolute inset-x-[-24px] inset-y-0" />
}
