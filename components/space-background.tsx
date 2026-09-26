import { useEffect, useRef } from "react"

/**
 * Fixed full-screen WebGL backdrop (dark theme only): twinkling starfield, soft nebula glows and a
 * gentle mouse parallax. three.js is imported lazily so it never delays the first paint.
 * Pauses when the tab is hidden and renders a single static frame with prefers-reduced-motion.
 */
export function SpaceBackground() {
  const hostRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    let disposed = false
    let cleanup = () => {}

    void import("three").then((THREE) => {
      if (disposed) return
      const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false

      let renderer: InstanceType<typeof THREE.WebGLRenderer>
      try {
        renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true, powerPreference: "low-power" })
      } catch {
        return // No WebGL: the CSS background stays
      }
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5))
      renderer.setSize(window.innerWidth, window.innerHeight)
      host.appendChild(renderer.domElement)

      const scene = new THREE.Scene()
      const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100)
      camera.position.z = 10

      // ── Stars: points with per-star size/phase, twinkle done in the shader ──
      const COUNT = window.innerWidth < 768 ? 900 : 1800
      const positions = new Float32Array(COUNT * 3)
      const sizes = new Float32Array(COUNT)
      const phases = new Float32Array(COUNT)
      const colors = new Float32Array(COUNT * 3)
      const palette = [new THREE.Color("#ffffff"), new THREE.Color("#c9f76b"), new THREE.Color("#8be9fd"), new THREE.Color("#c4b5fd")]
      for (let i = 0; i < COUNT; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 60
        positions[i * 3 + 1] = (Math.random() - 0.5) * 36
        positions[i * 3 + 2] = -Math.random() * 40
        sizes[i] = Math.random() < 0.07 ? 3.2 + Math.random() * 2.0 : 1.2 + Math.random() * 1.4
        phases[i] = Math.random() * Math.PI * 2
        const c = Math.random() < 0.8 ? palette[0] : palette[1 + Math.floor(Math.random() * 3)]
        colors.set([c.r, c.g, c.b], i * 3)
      }
      const starGeo = new THREE.BufferGeometry()
      starGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3))
      starGeo.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1))
      starGeo.setAttribute("aPhase", new THREE.BufferAttribute(phases, 1))
      starGeo.setAttribute("aColor", new THREE.BufferAttribute(colors, 3))
      const starMat = new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: { uTime: { value: 0 }, uPixelRatio: { value: renderer.getPixelRatio() } },
        vertexShader: /* glsl */ `
          attribute float aSize;
          attribute float aPhase;
          attribute vec3 aColor;
          uniform float uTime;
          uniform float uPixelRatio;
          varying float vAlpha;
          varying vec3 vColor;
          void main() {
            vec4 mv = modelViewMatrix * vec4(position, 1.0);
            gl_Position = projectionMatrix * mv;
            float twinkle = 0.55 + 0.45 * sin(uTime * (0.6 + fract(aPhase) * 1.4) + aPhase);
            vAlpha = twinkle * smoothstep(-42.0, -4.0, mv.z);
            vColor = aColor;
            gl_PointSize = aSize * uPixelRatio * (30.0 / -mv.z);
          }
        `,
        fragmentShader: /* glsl */ `
          varying float vAlpha;
          varying vec3 vColor;
          void main() {
            float d = length(gl_PointCoord - 0.5);
            float core = smoothstep(0.5, 0.0, d);
            float glow = core * core * 1.6 + smoothstep(0.12, 0.0, d);
            gl_FragColor = vec4(vColor, clamp(glow, 0.0, 1.0) * vAlpha);
          }
        `,
      })
      const stars = new THREE.Points(starGeo, starMat)
      scene.add(stars)

      // ── Nebulae: large additive radial sprites in brand colors ──
      const glowTexture = (() => {
        const c = document.createElement("canvas")
        c.width = c.height = 128
        const g = c.getContext("2d")!
        const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64)
        grad.addColorStop(0, "rgba(255,255,255,1)")
        grad.addColorStop(0.4, "rgba(255,255,255,0.35)")
        grad.addColorStop(1, "rgba(255,255,255,0)")
        g.fillStyle = grad
        g.fillRect(0, 0, 128, 128)
        return new THREE.CanvasTexture(c)
      })()
      const nebulae = [
        { color: "#76b900", x: -14, y: 7, z: -18, s: 30, o: 0.16 },
        { color: "#22d3ee", x: 16, y: -6, z: -22, s: 34, o: 0.1 },
        { color: "#a855f7", x: 4, y: 10, z: -26, s: 28, o: 0.09 },
      ].map((n) => {
        const sprite = new THREE.Sprite(
          new THREE.SpriteMaterial({ map: glowTexture, color: n.color, transparent: true, opacity: n.o, depthWrite: false, blending: THREE.AdditiveBlending })
        )
        sprite.position.set(n.x, n.y, n.z)
        sprite.scale.set(n.s, n.s, 1)
        scene.add(sprite)
        return { sprite, base: n }
      })

      // ── Interaction & loop ──
      const pointer = { x: 0, y: 0 }
      const onPointer = (e: PointerEvent) => {
        pointer.x = e.clientX / window.innerWidth - 0.5
        pointer.y = e.clientY / window.innerHeight - 0.5
      }
      const onResize = () => {
        camera.aspect = window.innerWidth / window.innerHeight
        camera.updateProjectionMatrix()
        renderer.setSize(window.innerWidth, window.innerHeight)
        if (reduceMotion) renderer.render(scene, camera)
      }
      window.addEventListener("pointermove", onPointer, { passive: true })
      window.addEventListener("resize", onResize)

      const t0 = performance.now()
      let raf = 0
      // ~30 fps is plenty for slow drift and halves the work of re-blurring glass panels on top
      let last = 0
      const tick = (now: number) => {
        raf = requestAnimationFrame(tick)
        if (now - last < 33) return
        last = now
        const t = (now - t0) / 1000
        starMat.uniforms.uTime.value = t
        // Very slow roll + sway: feels like drifting through space without visible looping
        stars.rotation.z = t * 0.006
        stars.rotation.y = Math.sin(t * 0.02) * 0.05
        nebulae.forEach(({ sprite, base }, i) => {
          sprite.material.opacity = base.o * (0.8 + 0.2 * Math.sin(t * 0.25 + i * 2))
        })
        camera.position.x += (pointer.x * 1.2 - camera.position.x) * 0.03
        camera.position.y += (-pointer.y * 0.8 - camera.position.y) * 0.03
        camera.lookAt(0, 0, -10)
        renderer.render(scene, camera)
      }
      const start = () => {
        if (!raf && !document.hidden) {
          raf = requestAnimationFrame(tick)
        }
      }
      const stop = () => {
        cancelAnimationFrame(raf)
        raf = 0
      }
      const onVisibility = () => (document.hidden ? stop() : start())

      if (reduceMotion) renderer.render(scene, camera)
      else {
        start()
        document.addEventListener("visibilitychange", onVisibility)
      }
      // Fade in once the first frame is ready
      requestAnimationFrame(() => host.classList.add("opacity-100"))

      cleanup = () => {
        stop()
        document.removeEventListener("visibilitychange", onVisibility)
        window.removeEventListener("pointermove", onPointer)
        window.removeEventListener("resize", onResize)
        starGeo.dispose()
        starMat.dispose()
        glowTexture.dispose()
        nebulae.forEach(({ sprite }) => sprite.material.dispose())
        renderer.dispose()
        renderer.domElement.remove()
      }
    })

    return () => {
      disposed = true
      cleanup()
    }
  }, [])

  return (
    <div
      ref={hostRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 opacity-0 transition-opacity duration-1000"
    />
  )
}
