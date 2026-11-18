import type { Dealer } from './types'

/** Live dealer list — starts empty; Join / registry hydrate real yards. */
export const dealers: Dealer[] = []

const LOGO_STORAGE_KEY = 'kv-dealer-logos'
const LOGO_EVENT = 'kv-dealer-logos-changed'

function readStoredLogos(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(LOGO_STORAGE_KEY) ?? '{}') as Record<string, string>
  } catch {
    return {}
  }
}

function hydrateLogos() {
  const logos = readStoredLogos()
  for (const dealer of dealers) {
    if (logos[dealer.id]) dealer.logo = logos[dealer.id]
  }
}

hydrateLogos()

export function getDealer(id: string) {
  return dealers.find((d) => d.id === id)
}

export function setDealerLogo(dealerId: string, logoDataUrl: string | null) {
  const dealer = dealers.find((d) => d.id === dealerId)
  if (!dealer) return

  const logos = readStoredLogos()
  if (logoDataUrl) {
    dealer.logo = logoDataUrl
    logos[dealerId] = logoDataUrl
  } else {
    delete dealer.logo
    delete logos[dealerId]
  }
  localStorage.setItem(LOGO_STORAGE_KEY, JSON.stringify(logos))
  window.dispatchEvent(new Event(LOGO_EVENT))
}

export function subscribeDealerLogos(listener: () => void) {
  window.addEventListener(LOGO_EVENT, listener)
  window.addEventListener('storage', listener)
  return () => {
    window.removeEventListener(LOGO_EVENT, listener)
    window.removeEventListener('storage', listener)
  }
}
