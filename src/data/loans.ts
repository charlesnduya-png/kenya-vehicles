import type { LoanPartner } from './types'

/** Live lenders — starts empty; Join / registry hydrate real partners. */
export const loanPartners: LoanPartner[] = []

const LOGO_STORAGE_KEY = 'kv-loan-partner-logos'
const PROFILE_STORAGE_KEY = 'kv-loan-partner-profiles'
const PARTNER_EVENT = 'kv-loan-partners-changed'

type StoredProfile = {
  rating?: number
  reviewCount?: number
  rateFrom?: number
  rateTo?: number
  minDepositPercent?: number
  maxLoan?: number
  maxTermMonths?: number
  highlight?: string
  phone?: string
  email?: string
  contactName?: string
}

function readStoredLogos(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(LOGO_STORAGE_KEY) ?? '{}') as Record<string, string>
  } catch {
    return {}
  }
}

function readStoredProfiles(): Record<string, StoredProfile> {
  try {
    return JSON.parse(localStorage.getItem(PROFILE_STORAGE_KEY) ?? '{}') as Record<
      string,
      StoredProfile
    >
  } catch {
    return {}
  }
}

function hydratePartners() {
  const logos = readStoredLogos()
  const profiles = readStoredProfiles()
  for (const partner of loanPartners) {
    if (logos[partner.id]) partner.logo = logos[partner.id]
    const profile = profiles[partner.id]
    if (!profile) continue
    if (profile.rating != null) partner.rating = profile.rating
    if (profile.reviewCount != null) partner.reviewCount = profile.reviewCount
    if (profile.rateFrom != null) partner.rateFrom = profile.rateFrom
    if (profile.rateTo != null) partner.rateTo = profile.rateTo
    if (profile.minDepositPercent != null) partner.minDepositPercent = profile.minDepositPercent
    if (profile.maxLoan != null) partner.maxLoan = profile.maxLoan
    if (profile.maxTermMonths != null) partner.maxTermMonths = profile.maxTermMonths
    if (profile.highlight != null) partner.highlight = profile.highlight
    if (profile.phone != null) partner.phone = profile.phone
    if (profile.email != null) partner.email = profile.email
    if (profile.contactName != null) partner.contactName = profile.contactName
  }
}

hydratePartners()

function emitChange() {
  window.dispatchEvent(new Event(PARTNER_EVENT))
}

export function getLoanPartner(id: string) {
  return loanPartners.find((p) => p.id === id)
}

export function setLoanPartnerLogo(partnerId: string, logoDataUrl: string | null) {
  const partner = loanPartners.find((p) => p.id === partnerId)
  if (!partner) return

  const logos = readStoredLogos()
  if (logoDataUrl) {
    partner.logo = logoDataUrl
    logos[partnerId] = logoDataUrl
  } else {
    delete partner.logo
    delete logos[partnerId]
  }
  localStorage.setItem(LOGO_STORAGE_KEY, JSON.stringify(logos))
  emitChange()
}

function saveProfile(partnerId: string, patch: StoredProfile) {
  const profiles = readStoredProfiles()
  profiles[partnerId] = { ...profiles[partnerId], ...patch }
  localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profiles))
  emitChange()
}

export function updateLoanPartnerRating(
  partnerId: string,
  rating: number,
  reviewCount?: number,
) {
  const partner = loanPartners.find((p) => p.id === partnerId)
  if (!partner) return

  const nextRating = Math.min(5, Math.max(1, Math.round(rating * 10) / 10))
  partner.rating = nextRating
  if (reviewCount != null) {
    partner.reviewCount = Math.max(0, Math.round(reviewCount))
  }

  saveProfile(partnerId, {
    rating: partner.rating,
    reviewCount: partner.reviewCount,
  })
}

export function updateLoanPartnerTerms(
  partnerId: string,
  terms: {
    rateFrom: number
    rateTo: number
    minDepositPercent: number
    maxLoan: number
    maxTermMonths: number
    highlight?: string
  },
) {
  const partner = loanPartners.find((p) => p.id === partnerId)
  if (!partner) return

  const rateFrom = Math.min(40, Math.max(1, Math.round(terms.rateFrom * 10) / 10))
  const rateTo = Math.min(45, Math.max(rateFrom, Math.round(terms.rateTo * 10) / 10))
  const minDepositPercent = Math.min(80, Math.max(0, Math.round(terms.minDepositPercent)))
  const maxLoan = Math.max(100000, Math.round(terms.maxLoan))
  const maxTermMonths = Math.min(120, Math.max(6, Math.round(terms.maxTermMonths)))

  partner.rateFrom = rateFrom
  partner.rateTo = rateTo
  partner.minDepositPercent = minDepositPercent
  partner.maxLoan = maxLoan
  partner.maxTermMonths = maxTermMonths
  if (terms.highlight != null) {
    partner.highlight = terms.highlight.trim() || partner.highlight
  }

  saveProfile(partnerId, {
    rateFrom: partner.rateFrom,
    rateTo: partner.rateTo,
    minDepositPercent: partner.minDepositPercent,
    maxLoan: partner.maxLoan,
    maxTermMonths: partner.maxTermMonths,
    highlight: partner.highlight,
  })
}

export function updateLoanPartnerContact(
  partnerId: string,
  contact: { phone: string; email: string; contactName?: string },
) {
  const partner = loanPartners.find((p) => p.id === partnerId)
  if (!partner) return

  partner.phone = contact.phone.trim() || partner.phone
  partner.email = contact.email.trim() || partner.email
  partner.contactName = contact.contactName?.trim() || partner.contactName

  saveProfile(partnerId, {
    phone: partner.phone,
    email: partner.email,
    contactName: partner.contactName,
  })
}

export function subscribeLoanPartners(listener: () => void) {
  window.addEventListener(PARTNER_EVENT, listener)
  window.addEventListener('storage', listener)
  return () => {
    window.removeEventListener(PARTNER_EVENT, listener)
    window.removeEventListener('storage', listener)
  }
}

export function estimateMonthlyPayment(
  price: number,
  depositPercent: number,
  annualRate: number,
  months: number,
) {
  const principal = price * (1 - depositPercent / 100)
  const monthlyRate = annualRate / 100 / 12
  if (monthlyRate === 0) return principal / months
  const payment =
    (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) /
    (Math.pow(1 + monthlyRate, months) - 1)
  return payment
}
