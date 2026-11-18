import { adminAccounts, type AdminAccount } from './admin'
import { dealers } from './dealers'
import { loanPartners } from './loans'
import type { Dealer, LoanPartner } from './types'

const ACCOUNTS_KEY = 'kv-registered-accounts'
const DEALERS_KEY = 'kv-registered-dealers'
const LENDERS_KEY = 'kv-registered-lenders'
const PASSWORDS_KEY = 'kv-account-passwords'
const EVENT = 'kv-partner-registry-changed'

type PasswordMap = Record<string, string>

function readPasswords(): PasswordMap {
  try {
    const raw = localStorage.getItem(PASSWORDS_KEY)
    if (!raw) return {}
    return JSON.parse(raw) as PasswordMap
  } catch {
    return {}
  }
}

export function setAccountPassword(email: string, password: string) {
  const map = readPasswords()
  map[email.trim().toLowerCase()] = password
  localStorage.setItem(PASSWORDS_KEY, JSON.stringify(map))
}

export function getAccountPassword(email: string): string | null {
  const value = readPasswords()[email.trim().toLowerCase()]
  return value || null
}

function today() {
  return new Date().toISOString().slice(0, 10)
}

function readJson<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return []
    return JSON.parse(raw) as T[]
  } catch {
    return []
  }
}

function writeJson<T>(key: string, rows: T[]) {
  localStorage.setItem(key, JSON.stringify(rows))
  window.dispatchEvent(new Event(EVENT))
}

function mergeUniqueById<T extends { id: string }>(base: T[], extra: T[]) {
  for (const row of extra) {
    if (!base.some((b) => b.id === row.id)) base.push(row)
  }
}

/** Hydrate live partner arrays with accounts created via Join */
export function hydrateRegisteredPartners() {
  mergeUniqueById(adminAccounts, readJson<AdminAccount>(ACCOUNTS_KEY))
  mergeUniqueById(dealers, readJson<Dealer>(DEALERS_KEY))
  mergeUniqueById(loanPartners, readJson<LoanPartner>(LENDERS_KEY))
}

hydrateRegisteredPartners()

function persistAccount(account: AdminAccount) {
  const rows = readJson<AdminAccount>(ACCOUNTS_KEY)
  const next = rows.some((r) => r.id === account.id)
    ? rows.map((r) => (r.id === account.id ? account : r))
    : [account, ...rows]
  writeJson(ACCOUNTS_KEY, next)
  mergeUniqueById(adminAccounts, [account])
}

function persistDealer(dealer: Dealer) {
  const rows = readJson<Dealer>(DEALERS_KEY)
  const next = rows.some((r) => r.id === dealer.id)
    ? rows.map((r) => (r.id === dealer.id ? dealer : r))
    : [dealer, ...rows]
  writeJson(DEALERS_KEY, next)
  mergeUniqueById(dealers, [dealer])
}

function persistLender(partner: LoanPartner) {
  const rows = readJson<LoanPartner>(LENDERS_KEY)
  const next = rows.some((r) => r.id === partner.id)
    ? rows.map((r) => (r.id === partner.id ? partner : r))
    : [partner, ...rows]
  writeJson(LENDERS_KEY, next)
  mergeUniqueById(loanPartners, [partner])
}

export function findAccountByEmail(email: string) {
  hydrateRegisteredPartners()
  return (
    adminAccounts.find((a) => a.email.toLowerCase() === email.trim().toLowerCase()) ?? null
  )
}

export type RegisterDealerInput = {
  businessName: string
  city: string
  contactName: string
  phone: string
  email: string
  password: string
  notes?: string
}

export function registerDealerAccount(input: RegisterDealerInput) {
  hydrateRegisteredPartners()
  const email = input.email.trim().toLowerCase()
  if (findAccountByEmail(email)) {
    return { ok: false as const, error: 'An account with that email already exists. Sign in instead.' }
  }
  if (input.password.trim().length < 8) {
    return { ok: false as const, error: 'Password must be at least 8 characters.' }
  }

  const accountId = `u-reg-${Date.now()}`
  const dealerId = `d-reg-${Date.now()}`
  const now = today()
  const city = input.city.trim() || 'Nairobi'

  const account: AdminAccount = {
    id: accountId,
    name: input.businessName.trim(),
    email,
    phone: input.phone.trim(),
    role: 'Dealer',
    status: 'Active',
    city,
    joined: now,
    lastActive: now,
    plan: 'Dealer',
    billingStatus: 'None',
  }

  const dealer: Dealer = {
    id: dealerId,
    name: input.businessName.trim(),
    city,
    county: city,
    phone: input.phone.trim(),
    email,
    verified: false,
    rating: 5,
    reviewCount: 0,
    carsListed: 0,
    yearsActive: 1,
    specialty: 'General stock',
    bio:
      input.notes?.trim() ||
      `${input.businessName.trim()} on Kenya Vehicles — sale and hire cars from our yard.`,
    coverImage: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=1200&q=80',
  }

  persistAccount(account)
  persistDealer(dealer)
  setAccountPassword(email, input.password)

  return {
    ok: true as const,
    account,
    dealer,
  }
}

export type RegisterLenderInput = {
  businessName: string
  city: string
  contactName: string
  phone: string
  email: string
  password: string
  institutionType?: string
  notes?: string
}

export function registerLenderAccount(input: RegisterLenderInput) {
  hydrateRegisteredPartners()
  const email = input.email.trim().toLowerCase()
  if (findAccountByEmail(email)) {
    return { ok: false as const, error: 'An account with that email already exists. Sign in instead.' }
  }
  if (input.password.trim().length < 8) {
    return { ok: false as const, error: 'Password must be at least 8 characters.' }
  }

  const accountId = `u-lend-${Date.now()}`
  const partnerId = `lp-reg-${Date.now()}`
  const now = today()
  const city = input.city.trim() || 'Nairobi'
  const allowed: LoanPartner['type'][] = ['Bank', 'Sacco', 'Microfinance', 'Fintech']
  const type = allowed.includes(input.institutionType as LoanPartner['type'])
    ? (input.institutionType as LoanPartner['type'])
    : 'Bank'

  const account: AdminAccount = {
    id: accountId,
    name: input.businessName.trim(),
    email,
    phone: input.phone.trim(),
    role: 'Loan partner',
    status: 'Active',
    city,
    joined: now,
    lastActive: now,
    plan: 'Lender',
    billingStatus: 'None',
  }

  const partner: LoanPartner = {
    id: partnerId,
    name: input.businessName.trim(),
    type,
    rateFrom: 12,
    rateTo: 18,
    maxTermMonths: 60,
    minDepositPercent: 20,
    maxLoan: 5000000,
    cities: [city],
    highlight:
      input.notes?.trim() ||
      'New Kenya Vehicles loan partner — account is free to create.',
    logoColor: '#0f766e',
    rating: 5,
    reviewCount: 0,
    phone: input.phone.trim(),
    email,
    contactName: input.contactName.trim(),
  }

  persistAccount(account)
  persistLender(partner)
  setAccountPassword(email, input.password)

  return {
    ok: true as const,
    account,
    partner,
  }
}

export function subscribePartnerRegistry(cb: () => void) {
  window.addEventListener(EVENT, cb)
  window.addEventListener('storage', cb)
  return () => {
    window.removeEventListener(EVENT, cb)
    window.removeEventListener('storage', cb)
  }
}
