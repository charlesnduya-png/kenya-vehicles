import { getDealer } from './dealers'
import type { BodyType, RentalCar } from './types'

const STORAGE_KEY = 'kv-rental-cars'
const EVENT = 'kv-rentals-changed'

const seed: RentalCar[] = []

function migrate(list: RentalCar[]): RentalCar[] {
  return list.map((r) => {
    const anyR = r as RentalCar & { ownerId?: string }
    if (anyR.dealerId) return anyR
    const legacy: Record<string, string> = {
      ro1: 'd1',
      ro2: 'd2',
      ro3: 'd4',
      ro4: 'd6',
    }
    return { ...anyR, dealerId: legacy[anyR.ownerId ?? ''] ?? 'd1' }
  })
}

function read(): RentalCar[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seed))
      return seed.map((r) => ({ ...r }))
    }
    return migrate(JSON.parse(raw) as RentalCar[])
  } catch {
    return seed.map((r) => ({ ...r }))
  }
}

function write(list: RentalCar[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
  window.dispatchEvent(new Event(EVENT))
}

/** Live hire fleet (dealers list these) */
export function getRentals() {
  return read().sort((a, b) => Number(b.featured) - Number(a.featured) || a.make.localeCompare(b.make))
}

/** @deprecated use getRentals() — kept for older imports */
export const rentalCars = seed

export function getRental(id: string) {
  return read().find((r) => r.id === id)
}

export function getRentalsByDealer(dealerId: string) {
  return getRentals().filter((r) => r.dealerId === dealerId)
}

export function dealersWithRentals() {
  const ids = new Set(getRentals().map((r) => r.dealerId))
  return [...ids].map((id) => getDealer(id)).filter(Boolean)
}

export type NewRentalInput = {
  dealerId: string
  make: string
  model: string
  year: number
  pricePerDay: number
  pricePerWeek: number
  deposit: number
  transmission: 'Automatic' | 'Manual'
  fuel: 'Petrol' | 'Diesel' | 'Hybrid' | 'Electric'
  bodyType: BodyType
  seats: number
  city: string
  county: string
  withDriver: boolean
  selfDrive: boolean
  featured?: boolean
  available?: boolean
  description: string
  includes?: string[]
  images?: string[]
}

export function addRental(input: NewRentalInput) {
  const list = read()
  const rental: RentalCar = {
    id: `r-${Date.now()}`,
    dealerId: input.dealerId,
    make: input.make.trim(),
    model: input.model.trim(),
    year: input.year,
    pricePerDay: input.pricePerDay,
    pricePerWeek: input.pricePerWeek,
    deposit: input.deposit,
    transmission: input.transmission,
    fuel: input.fuel,
    bodyType: input.bodyType,
    seats: input.seats,
    city: input.city.trim(),
    county: input.county.trim(),
    withDriver: input.withDriver,
    selfDrive: input.selfDrive,
    featured: Boolean(input.featured),
    available: input.available !== false,
    images:
      input.images && input.images.length > 0
        ? input.images
        : [
            'https://upload.wikimedia.org/wikipedia/commons/5/55/2016_Toyota_Corolla_Axio_Hybrid_sedan_front.jpg',
          ],
    description: input.description.trim() || `${input.year} ${input.make} ${input.model} for hire.`,
    includes: input.includes?.length
      ? input.includes
      : ['Comprehensive insurance', 'Kenya Vehicles booking'],
  }
  write([rental, ...list])
  return rental
}

export type RentalUpdate = Partial<Omit<RentalCar, 'id' | 'dealerId'>>

export function updateRental(id: string, dealerId: string, patch: RentalUpdate) {
  const list = read()
  const idx = list.findIndex((r) => r.id === id && r.dealerId === dealerId)
  if (idx < 0) return null
  const current = list[idx]
  const next: RentalCar = {
    ...current,
    ...patch,
    id: current.id,
    dealerId: current.dealerId,
  }
  if (typeof patch.make === 'string') next.make = patch.make.trim()
  if (typeof patch.model === 'string') next.model = patch.model.trim()
  if (typeof patch.description === 'string') next.description = patch.description.trim()
  if (typeof patch.city === 'string') next.city = patch.city.trim()
  if (typeof patch.county === 'string') next.county = patch.county.trim()
  if (Array.isArray(patch.includes)) {
    next.includes = patch.includes.map((item) => item.trim()).filter(Boolean)
  }
  list[idx] = next
  write(list)
  return next
}

export function setRentalAvailable(id: string, available: boolean) {
  const list = read()
  const row = list.find((r) => r.id === id)
  if (!row) return
  row.available = available
  write(list)
}

export function subscribeRentals(listener: () => void) {
  window.addEventListener(EVENT, listener)
  window.addEventListener('storage', listener)
  return () => {
    window.removeEventListener(EVENT, listener)
    window.removeEventListener('storage', listener)
  }
}
