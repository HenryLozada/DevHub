// Per-device preference for the animated space backdrop (dark theme)
const KEY = "ph_space_fx"
export const SPACE_FX_EVENT = "ph:space-fx"

export function getSpaceFx(): boolean {
  try {
    return localStorage.getItem(KEY) === "1"
  } catch {
    return false
  }
}

export function setSpaceFx(enabled: boolean) {
  try {
    localStorage.setItem(KEY, enabled ? "1" : "0")
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new Event(SPACE_FX_EVENT))
}
