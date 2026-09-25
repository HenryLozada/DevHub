// Server-only: classifies resolved addresses so /api/metadata cannot reach internal networks
import { isIP } from "node:net"

/** True for loopback, private, link-local, CGNAT, multicast/reserved and unparseable addresses. */
export function isPrivateIp(address: string): boolean {
  const addr = address.toLowerCase()
  const mapped = addr.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/)
  if (mapped) return isPrivateIp(mapped[1])

  const ipv4 = addr.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/)
  if (ipv4) {
    const [a, b] = [Number(ipv4[1]), Number(ipv4[2])]
    return (
      a === 0 || a === 10 || a === 127 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      a >= 224
    )
  }

  if (isIP(addr) === 6) {
    return (
      addr === "::" || addr === "::1" ||
      addr.startsWith("fc") || addr.startsWith("fd") ||
      /^fe[89ab]/.test(addr)
    )
  }
  return true
}
