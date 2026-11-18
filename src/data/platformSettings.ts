const STORAGE_KEY = 'kv-platform-settings'
const EVENT = 'kv-platform-settings-changed'

export type PlatformSettings = {
  /** When true, dealers must pay before listing. When false, the site is free. */
  paymentsRequired: boolean
}

const defaults: PlatformSettings = {
  paymentsRequired: false,
}

function read(): PlatformSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...defaults }
    const parsed = JSON.parse(raw) as Partial<PlatformSettings>
    return {
      paymentsRequired: Boolean(parsed.paymentsRequired),
    }
  } catch {
    return { ...defaults }
  }
}

function write(next: PlatformSettings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  window.dispatchEvent(new Event(EVENT))
}

export function getPlatformSettings(): PlatformSettings {
  return read()
}

export function isPaymentsRequired(): boolean {
  return read().paymentsRequired
}

export function setPaymentsRequired(required: boolean) {
  const next = { ...read(), paymentsRequired: required }
  write(next)
  return next
}

export function subscribePlatformSettings(cb: () => void) {
  window.addEventListener(EVENT, cb)
  window.addEventListener('storage', cb)
  return () => {
    window.removeEventListener(EVENT, cb)
    window.removeEventListener('storage', cb)
  }
}
