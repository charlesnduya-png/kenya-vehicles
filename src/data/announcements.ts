export type AnnouncementTone = 'info' | 'success' | 'warning'

export type SiteAnnouncement = {
  id: string
  title: string
  message: string
  tone: AnnouncementTone
  active: boolean
  createdAt: string
  pushedAt?: string
  pushedBy: string
}

const STORAGE_KEY = 'kv-site-announcements'
const EVENT = 'kv-announcements-changed'

const seed: SiteAnnouncement[] = [
  {
    id: 'a1',
    title: 'Welcome to Kenya Vehicles',
    message: 'Shop cars, rentals and loans from verified dealers across Kenya.',
    tone: 'info',
    active: false,
    createdAt: '2026-03-10T09:00:00.000Z',
    pushedBy: 'Platform Admin',
  },
]

function read(): SiteAnnouncement[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seed))
      return seed.map((a) => ({ ...a }))
    }
    return JSON.parse(raw) as SiteAnnouncement[]
  } catch {
    return seed.map((a) => ({ ...a }))
  }
}

function write(list: SiteAnnouncement[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
  window.dispatchEvent(new Event(EVENT))
}

export function getAnnouncements() {
  return read()
}

export function getActiveAnnouncement() {
  return read().find((a) => a.active) ?? null
}

export function createAnnouncement(input: {
  title: string
  message: string
  tone: AnnouncementTone
  pushNow?: boolean
}) {
  const list = read()
  const next: SiteAnnouncement = {
    id: `a-${Date.now()}`,
    title: input.title.trim(),
    message: input.message.trim(),
    tone: input.tone,
    active: false,
    createdAt: new Date().toISOString(),
    pushedBy: 'Platform Admin',
  }

  if (input.pushNow) {
    for (const item of list) item.active = false
    next.active = true
    next.pushedAt = new Date().toISOString()
  }

  list.unshift(next)
  write(list)
  return next
}

export function pushAnnouncement(id: string) {
  const list = read().map((a) => ({
    ...a,
    active: a.id === id,
    pushedAt: a.id === id ? new Date().toISOString() : a.pushedAt,
  }))
  write(list)
}

export function unpublishAnnouncement(id: string) {
  const list = read().map((a) => (a.id === id ? { ...a, active: false } : a))
  write(list)
}

export function deleteAnnouncement(id: string) {
  write(read().filter((a) => a.id !== id))
}

export function subscribeAnnouncements(listener: () => void) {
  window.addEventListener(EVENT, listener)
  window.addEventListener('storage', listener)
  return () => {
    window.removeEventListener(EVENT, listener)
    window.removeEventListener('storage', listener)
  }
}
