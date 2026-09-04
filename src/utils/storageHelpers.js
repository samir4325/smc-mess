// localStorage helpers
const PREFIX = 'smc_gec_'

export function ls_get(key) {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function ls_set(key, value) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value))
  } catch (e) {
    console.error('localStorage write failed:', e)
  }
}

export function ls_remove(key) {
  localStorage.removeItem(PREFIX + key)
}

export function ls_clear_all() {
  Object.keys(localStorage)
    .filter(k => k.startsWith(PREFIX))
    .forEach(k => localStorage.removeItem(k))
}
