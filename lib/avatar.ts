const KEY = "ph_user_avatar"

export function getAvatar(): string | null {
  try {
    return localStorage.getItem(KEY)
  } catch {
    return null
  }
}

export function setAvatar(dataUrl: string) {
  try {
    localStorage.setItem(KEY, dataUrl)
  } catch {}
}

export function clearAvatar() {
  try {
    localStorage.removeItem(KEY)
  } catch {}
}
