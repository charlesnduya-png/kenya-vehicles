export type OfferStatus = 'New' | 'Accepted' | 'Declined' | 'Withdrawn'

export type CarOffer = {
  id: string
  carId: string
  dealerId: string
  carLabel: string
  askingPrice: number
  amount: number
  message: string
  buyerName: string
  buyerPhone: string
  buyerEmail: string
  status: OfferStatus
  createdAt: string
}

const STORAGE_KEY = 'kv-car-offers'
const EVENT = 'kv-offers-changed'

function read(): CarOffer[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as CarOffer[]
  } catch {
    return []
  }
}

function write(list: CarOffer[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
  window.dispatchEvent(new Event(EVENT))
}

export function getOffers() {
  return read()
}

export function getOffersForDealer(dealerId: string) {
  return read().filter((o) => o.dealerId === dealerId)
}

export function getOffersForCar(carId: string) {
  return read().filter((o) => o.carId === carId)
}

export function submitOffer(input: Omit<CarOffer, 'id' | 'status' | 'createdAt'>) {
  const next: CarOffer = {
    ...input,
    id: `off-${Date.now()}`,
    status: 'New',
    createdAt: new Date().toISOString(),
  }
  write([next, ...read()])
  return next
}

export function updateOfferStatus(id: string, status: OfferStatus) {
  write(read().map((o) => (o.id === id ? { ...o, status } : o)))
}

export function subscribeOffers(listener: () => void) {
  window.addEventListener(EVENT, listener)
  window.addEventListener('storage', listener)
  return () => {
    window.removeEventListener(EVENT, listener)
    window.removeEventListener('storage', listener)
  }
}
