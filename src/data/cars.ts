import { dealers } from './dealers'
import type { Car } from './types'

function syncDealerCarsListed(dealerId: string) {
  const dealer = dealers.find((d) => d.id === dealerId)
  if (!dealer) return
  dealer.carsListed = read().filter((c) => c.dealerId === dealerId).length
}

const seedCars: Car[] = []

const STORAGE_KEY = 'kv-sale-cars'
const EVENT = 'kv-cars-changed'

function read(): Car[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seedCars))
      return []
    }
    return JSON.parse(raw) as Car[]
  } catch {
    return []
  }
}

function write(list: Car[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
  window.dispatchEvent(new Event(EVENT))
}

/** Live sale inventory (dealers can edit) */
export function getCars() {
  return read()
}

/** Prefer getCars() for live data */
export const cars = seedCars

export function getCar(id: string) {
  return read().find((c) => c.id === id)
}

export function getCarsByDealer(dealerId: string) {
  return read().filter((c) => c.dealerId === dealerId)
}

export type CarUpdate = Partial<Omit<Car, 'id' | 'dealerId'>> & {
  make?: string
  model?: string
}

export function updateCar(id: string, dealerId: string, patch: CarUpdate) {
  const list = read()
  const idx = list.findIndex((c) => c.id === id && c.dealerId === dealerId)
  if (idx < 0) return null
  const next: Car = {
    ...list[idx],
    ...patch,
    id: list[idx].id,
    dealerId: list[idx].dealerId,
  }
  if (typeof patch.make === 'string') next.make = patch.make.trim()
  if (typeof patch.model === 'string') next.model = patch.model.trim()
  if (typeof patch.description === 'string') next.description = patch.description.trim()
  if (typeof patch.color === 'string') next.color = patch.color.trim()
  if (typeof patch.city === 'string') next.city = patch.city.trim()
  if (typeof patch.county === 'string') next.county = patch.county.trim()
  if (Array.isArray(patch.features)) {
    next.features = patch.features.map((f) => f.trim()).filter(Boolean)
  }
  list[idx] = next
  write(list)
  return next
}

export type NewCarInput = {
  dealerId: string
  make: string
  model: string
  year: number
  price: number
  mileage: number
  transmission: Car['transmission']
  fuel: Car['fuel']
  bodyType: Car['bodyType']
  color: string
  city: string
  county: string
  condition: Car['condition']
  featured?: boolean
  description: string
  features?: string[]
  images?: string[]
}

export function addCar(input: NewCarInput) {
  const list = read()
  const car: Car = {
    id: `c-${Date.now()}`,
    dealerId: input.dealerId,
    make: input.make.trim(),
    model: input.model.trim(),
    year: input.year,
    price: input.price,
    mileage: input.mileage,
    transmission: input.transmission,
    fuel: input.fuel,
    bodyType: input.bodyType,
    color: input.color.trim() || 'White',
    city: input.city.trim(),
    county: input.county.trim(),
    condition: input.condition,
    featured: Boolean(input.featured),
    images:
      input.images && input.images.length > 0
        ? input.images
        : [
            'https://upload.wikimedia.org/wikipedia/commons/5/55/2016_Toyota_Corolla_Axio_Hybrid_sedan_front.jpg',
          ],
    description:
      input.description.trim() ||
      `${input.year} ${input.make} ${input.model} listed on Kenya Vehicles.`,
    features: input.features?.length
      ? input.features
      : ['Inspected', 'Kenya Vehicles listing'],
  }
  write([car, ...list])
  syncDealerCarsListed(input.dealerId)
  return car
}

export function setCarFeatured(id: string, dealerId: string, featured: boolean) {
  return updateCar(id, dealerId, { featured })
}

export function subscribeCars(listener: () => void) {
  window.addEventListener(EVENT, listener)
  window.addEventListener('storage', listener)
  return () => {
    window.removeEventListener(EVENT, listener)
    window.removeEventListener('storage', listener)
  }
}

export function formatKES(amount: number) {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatMileage(km: number) {
  return `${new Intl.NumberFormat('en-KE').format(km)} km`
}
