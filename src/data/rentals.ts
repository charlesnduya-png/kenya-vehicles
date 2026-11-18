import { getDealer } from './dealers'
import type { BodyType, RentalCar } from './types'

const STORAGE_KEY = 'kv-rental-cars'
const EVENT = 'kv-rentals-changed'

const seed: RentalCar[] = [
  {
    id: 'r1',
    dealerId: 'd1',
    make: 'Toyota',
    model: 'Axio',
    year: 2016,
    pricePerDay: 4500,
    pricePerWeek: 28000,
    deposit: 20000,
    transmission: 'Automatic',
    fuel: 'Petrol',
    bodyType: 'Sedan',
    seats: 5,
    city: 'Nairobi',
    county: 'Nairobi',
    withDriver: true,
    selfDrive: true,
    featured: true,
    available: true,
    images: [
      'https://upload.wikimedia.org/wikipedia/commons/5/55/2016_Toyota_Corolla_Axio_Hybrid_sedan_front.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/4/42/Toyota_Corolla_Axio_%28E160%29_front.JPG',
    ],
    description: 'Kenya-favourite Axio for city errands, airport runs and CBD meetings.',
    includes: ['Comprehensive insurance', 'Nairobi km package', 'Airport pickup'],
  },
  {
    id: 'r2',
    dealerId: 'd1',
    make: 'Toyota',
    model: 'Harrier',
    year: 2017,
    pricePerDay: 9000,
    pricePerWeek: 55000,
    deposit: 50000,
    transmission: 'Automatic',
    fuel: 'Petrol',
    bodyType: 'SUV',
    seats: 5,
    city: 'Nairobi',
    county: 'Nairobi',
    withDriver: true,
    selfDrive: true,
    featured: true,
    available: true,
    images: [
      'https://upload.wikimedia.org/wikipedia/commons/d/d1/Toyota_HARRIER_PREMIUM_%28DBA-ZSU60W-ANXGP%29_front.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/c/c4/Toyota_HARRIER_PREMIUM_%28DBA-ZSU60W-ANXGP%29_rear.jpg',
    ],
    description: 'Harrier hire for family trips, weddings and corporate visits across Kenya.',
    includes: ['Full tank start', 'Child seat optional', '24/7 roadside help'],
  },
  {
    id: 'r3',
    dealerId: 'd2',
    make: 'Toyota',
    model: 'Hilux',
    year: 2018,
    pricePerDay: 11000,
    pricePerWeek: 68000,
    deposit: 60000,
    transmission: 'Manual',
    fuel: 'Diesel',
    bodyType: 'Pickup',
    seats: 5,
    city: 'Mombasa',
    county: 'Mombasa',
    withDriver: true,
    selfDrive: true,
    featured: true,
    available: true,
    images: [
      'https://upload.wikimedia.org/wikipedia/commons/0/0d/2024_Toyota_Hilux_2.4_V_4x4_Crew_Cab_%28Indonesia%29_front_view.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/0/0d/2024_Toyota_Hilux_2.4_V_4x4_Crew_Cab_%28Indonesia%29_front_view.jpg',
    ],
    description: 'Coast Hilux for beach runs, site work and upcountry travel from Mombasa.',
    includes: ['Canopy', 'Spare tyre', 'Driver available'],
  },
  {
    id: 'r4',
    dealerId: 'd4',
    make: 'Subaru',
    model: 'Forester',
    year: 2016,
    pricePerDay: 7500,
    pricePerWeek: 45000,
    deposit: 40000,
    transmission: 'Automatic',
    fuel: 'Petrol',
    bodyType: 'SUV',
    seats: 5,
    city: 'Nakuru',
    county: 'Nakuru',
    withDriver: false,
    selfDrive: true,
    featured: false,
    available: true,
    images: [
      'https://upload.wikimedia.org/wikipedia/commons/9/96/Subaru_FORESTER_2.0i-L_EyeSight_%28DBA-SJ5%29_front.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/9/96/Subaru_FORESTER_2.0i-L_EyeSight_%28DBA-SJ5%29_front.jpg',
    ],
    description: 'AWD Forester for Naivasha weekends, murram roads and Rift Valley weather.',
    includes: ['Self-drive only', 'GPS', 'Extra spare'],
  },
  {
    id: 'r5',
    dealerId: 'd6',
    make: 'Toyota',
    model: 'Vitz',
    year: 2015,
    pricePerDay: 3500,
    pricePerWeek: 21000,
    deposit: 15000,
    transmission: 'Automatic',
    fuel: 'Petrol',
    bodyType: 'Hatchback',
    seats: 5,
    city: 'Nairobi',
    county: 'Nairobi',
    withDriver: false,
    selfDrive: true,
    featured: false,
    available: true,
    images: [
      'https://upload.wikimedia.org/wikipedia/commons/e/ec/Toyota_Vitz_1.3F_2WD_%28KSP130%29_front.JPG',
      'https://upload.wikimedia.org/wikipedia/commons/e/ec/Toyota_Vitz_1.3F_2WD_%28KSP130%29_front.JPG',
    ],
    description: 'Budget Vitz for daily Nairobi hire — fuel efficient and easy to park.',
    includes: ['Self-drive', 'Fuel efficient', 'City insurance'],
  },
  {
    id: 'r6',
    dealerId: 'd2',
    make: 'Toyota',
    model: 'Hiace',
    year: 2017,
    pricePerDay: 12000,
    pricePerWeek: 72000,
    deposit: 70000,
    transmission: 'Manual',
    fuel: 'Diesel',
    bodyType: 'Van',
    seats: 14,
    city: 'Mombasa',
    county: 'Mombasa',
    withDriver: true,
    selfDrive: false,
    featured: true,
    available: true,
    images: [
      'https://upload.wikimedia.org/wikipedia/commons/7/7d/Toyota_Hiace_front.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/7/7d/Toyota_Hiace_front.jpg',
    ],
    description: '14-seater Hiace with driver for coast tours, staff shuttle and group travel.',
    includes: ['Professional driver', 'AC', 'Group rates'],
  },
  {
    id: 'r7',
    dealerId: 'd1',
    make: 'Toyota',
    model: 'Premio',
    year: 2017,
    pricePerDay: 6500,
    pricePerWeek: 40000,
    deposit: 35000,
    transmission: 'Automatic',
    fuel: 'Petrol',
    bodyType: 'Sedan',
    seats: 5,
    city: 'Nairobi',
    county: 'Nairobi',
    withDriver: true,
    selfDrive: true,
    featured: false,
    available: true,
    images: [
      'https://upload.wikimedia.org/wikipedia/commons/c/ce/18_Toyota_Premio_%28T260%29.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/a/a7/18_Toyota_Premio_%28T260%29_back.jpg',
    ],
    description: 'Premio for business meetings and VIP airport transfers in Nairobi.',
    includes: ['Chauffeur option', 'Bluetooth', 'Flexible weekend rates'],
  },
  {
    id: 'r8',
    dealerId: 'd4',
    make: 'Toyota',
    model: 'Probox',
    year: 2015,
    pricePerDay: 4000,
    pricePerWeek: 24000,
    deposit: 18000,
    transmission: 'Automatic',
    fuel: 'Petrol',
    bodyType: 'Van',
    seats: 5,
    city: 'Nakuru',
    county: 'Nakuru',
    withDriver: false,
    selfDrive: true,
    featured: false,
    available: false,
    images: [
      'https://upload.wikimedia.org/wikipedia/commons/a/a3/Toyota_Probox_GL_NCP160V.jpg',
      'https://upload.wikimedia.org/wikipedia/commons/b/be/Toyota_Probox_GL_NCP160V_rear.jpg',
    ],
    description: 'Probox hire for cargo and business runs. Currently booked — join waitlist.',
    includes: ['Self-drive', 'Cargo friendly'],
  },
]

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
    featured: false,
    available: true,
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
