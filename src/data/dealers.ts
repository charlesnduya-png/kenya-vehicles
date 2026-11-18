import type { Dealer } from './types'

export const dealers: Dealer[] = [
  {
    id: 'd1',
    name: 'Summit Motors Kenya',
    city: 'Nairobi',
    county: 'Nairobi',
    phone: '+254 712 340 001',
    email: 'sales@summitmotors.co.ke',
    verified: true,
    rating: 4.8,
    reviewCount: 214,
    carsListed: 4,
    yearsActive: 12,
    specialty: 'SUVs & family cars',
    bio: 'Westlands-based dealership specializing in foreign-used Toyota, Mazda, and Subaru stock with full inspection reports.',
    coverImage: 'https://images.unsplash.com/photo-1563720223185-11003d516935?w=1200&q=80',
  },
  {
    id: 'd2',
    name: 'Coastline Auto Hub',
    city: 'Mombasa',
    county: 'Mombasa',
    phone: '+254 722 881 220',
    email: 'hello@coastlineauto.co.ke',
    verified: true,
    rating: 4.6,
    reviewCount: 98,
    carsListed: 3,
    yearsActive: 8,
    specialty: 'Pickups & commercials',
    bio: 'Nyali showroom focused on Hilux, Navara, and van fleets for coastal businesses and families.',
    coverImage: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=1200&q=80',
  },
  {
    id: 'd3',
    name: 'Lakeview Motors',
    city: 'Kisumu',
    county: 'Kisumu',
    phone: '+254 733 450 910',
    email: 'info@lakeviewmotors.co.ke',
    verified: true,
    rating: 4.7,
    reviewCount: 76,
    carsListed: 2,
    yearsActive: 6,
    specialty: 'Affordable hatchbacks',
    bio: 'Trusted Nyanza dealer for budget-friendly Vitz, Demio, and Axio units ready for same-week delivery.',
    coverImage: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1200&q=80',
  },
  {
    id: 'd4',
    name: 'Rift Valley Autos',
    city: 'Nakuru',
    county: 'Nakuru',
    phone: '+254 701 223 445',
    email: 'sales@riftvalleyautos.co.ke',
    verified: true,
    rating: 4.5,
    reviewCount: 61,
    carsListed: 2,
    yearsActive: 9,
    specialty: 'Trades & farm vehicles',
    bio: 'Serving Nakuru and surrounding counties with inspected locally used and foreign-used inventory.',
    coverImage: 'https://images.unsplash.com/photo-1542362567-b07e54389920?w=1200&q=80',
  },
  {
    id: 'd5',
    name: 'Highlands Drive',
    city: 'Eldoret',
    county: 'Uasin Gishu',
    phone: '+254 745 667 890',
    email: 'team@highlandsdrive.co.ke',
    verified: true,
    rating: 4.9,
    reviewCount: 143,
    carsListed: 3,
    yearsActive: 11,
    specialty: 'Premium imports',
    bio: 'Eldoret flagship for Land Cruisers, Prados, and executive sedans with doorstep handover across the Rift.',
    coverImage: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=1200&q=80',
  },
  {
    id: 'd6',
    name: 'Capital City Cars',
    city: 'Nairobi',
    county: 'Nairobi',
    phone: '+254 798 112 334',
    email: 'desk@capitalcitycars.co.ke',
    verified: false,
    rating: 4.3,
    reviewCount: 39,
    carsListed: 2,
    yearsActive: 3,
    specialty: 'City runabouts',
    bio: 'Industrial Area yard stocking clean city cars for first-time buyers and ride-hailing drivers.',
    coverImage: 'https://images.unsplash.com/photo-1583121274602-3e282f28bbc1?w=1200&q=80',
  },
]

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
