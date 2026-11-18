export type BodyType = 'Sedan' | 'SUV' | 'Hatchback' | 'Pickup' | 'Van' | 'Coupe'

export interface Dealer {
  id: string
  name: string
  city: string
  county: string
  phone: string
  email: string
  verified: boolean
  rating: number
  reviewCount: number
  carsListed: number
  yearsActive: number
  specialty: string
  bio: string
  coverImage: string
  /** Optional yard logo (data URL or hosted image) */
  logo?: string
}

export interface Car {
  id: string
  dealerId: string
  make: string
  model: string
  year: number
  price: number
  mileage: number
  transmission: 'Automatic' | 'Manual'
  fuel: 'Petrol' | 'Diesel' | 'Hybrid' | 'Electric'
  bodyType: BodyType
  color: string
  city: string
  county: string
  condition: 'Foreign Used' | 'Locally Used' | 'Brand New'
  featured: boolean
  images: string[]
  description: string
  features: string[]
}

export interface LoanPartner {
  id: string
  name: string
  type: 'Bank' | 'Sacco' | 'Microfinance' | 'Fintech'
  rateFrom: number
  rateTo: number
  maxTermMonths: number
  minDepositPercent: number
  maxLoan: number
  cities: string[]
  highlight: string
  logoColor: string
  rating: number
  reviewCount: number
  /** Optional partner logo (data URL or hosted image) */
  logo?: string
}

export interface RentalOwner {
  id: string
  name: string
  city: string
  phone: string
  verified: boolean
  rating: number
  reviewCount: number
  carsListed: number
}

export interface RentalCar {
  id: string
  ownerId: string
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
  featured: boolean
  available: boolean
  images: string[]
  description: string
  includes: string[]
}
