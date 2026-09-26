import type { APIRoute } from "astro"
import { defaultKeepaliveDeps, handleKeepalive } from "@/lib/keepalive"

export const prerender = false

export const GET: APIRoute = ({ request }) => handleKeepalive(request, defaultKeepaliveDeps())
