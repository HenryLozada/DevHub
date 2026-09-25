/* PersonalHub service worker — standalone PWA + local notifications */
// Versioned per deploy via /sw.js?v=<build id> (see lib/notifications.ts)
const VERSION = new URL(self.location.href).searchParams.get("v") || "dev"
const CACHE = `personalhub-${VERSION}`
const SHELL = ["/", "/manifest.webmanifest", "/apple-icon.png", "/icon-192.png", "/icon-512.png"]

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(SHELL).catch(() => undefined)).then(() => self.skipWaiting())
  )
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  )
})

self.addEventListener("fetch", (event) => {
  const { request } = event
  if (request.method !== "GET") return
  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return
  if (url.pathname.startsWith("/api/")) return

  // Hashed build assets never change: serve from cache first
  if (url.pathname.startsWith("/_astro/")) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            if (response.ok) {
              const copy = response.clone()
              caches.open(CACHE).then((cache) => cache.put(request, copy)).catch(() => undefined)
            }
            return response
          })
      )
    )
    return
  }

  event.respondWith(
    fetch(request)
      .then((response) => {
        const copy = response.clone()
        if (response.ok && (request.mode === "navigate" || url.pathname.match(/\.(js|css|png|svg|webmanifest)$/))) {
          caches.open(CACHE).then((cache) => cache.put(request, copy)).catch(() => undefined)
        }
        return response
      })
      .catch(() => caches.match(request).then((cached) => cached || caches.match("/")))
  )
})

const timers = new Map()

self.addEventListener("message", (event) => {
  const data = event.data || {}
  if (data.type === "CLEAR_NOTIFICATIONS") {
    for (const id of timers.keys()) {
      clearTimeout(timers.get(id))
      timers.delete(id)
    }
    return
  }

  if (data.type === "SCHEDULE_NOTIFICATIONS" && Array.isArray(data.items)) {
    for (const id of timers.keys()) {
      clearTimeout(timers.get(id))
      timers.delete(id)
    }

    const now = Date.now()
    for (const item of data.items) {
      if (!item?.id || !item?.title || !item?.at) continue
      const delay = Number(item.at) - now
      if (delay < 0 || delay > 1000 * 60 * 60 * 24 * 7) continue

      const timer = setTimeout(() => {
        timers.delete(item.id)
        self.registration.showNotification(item.title, {
          body: item.body || "Recordatorio de PersonalHub",
          icon: "/icon-192.png",
          badge: "/icon-192.png",
          tag: item.id,
          renotify: true,
          data: { url: item.url || "/" },
          vibrate: [120, 60, 120],
        })
      }, delay)

      timers.set(item.id, timer)
    }
  }
})

self.addEventListener("notificationclick", (event) => {
  event.notification.close()
  const target = event.notification.data?.url || "/"
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ("focus" in client) {
          client.navigate?.(target)
          return client.focus()
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(target)
    })
  )
})
