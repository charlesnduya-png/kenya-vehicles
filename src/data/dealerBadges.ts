import { dealers } from './dealers'
import { BILLING_EVENT_NAME, SUBSCRIPTION_PRICE_KES, formatBillingKES } from './billing'

export const VERIFIED_BADGE_DURATION_MONTHS = 2

export const verifiedBadgeProduct = {
  id: 'badge-verified-2m',
  name: 'Verified Dealer Badge',
  price: SUBSCRIPTION_PRICE_KES,
  durationMonths: VERIFIED_BADGE_DURATION_MONTHS,
  perks: [
    'Verified badge on your yard profile and listings',
    'Higher trust with buyers',
    `Renews every ${VERIFIED_BADGE_DURATION_MONTHS} months`,
    'Buy or renew anytime from your dealer account',
  ],
}

export type DealerBadgeStatus = 'Active' | 'Expired' | 'Pending payment'

export type DealerBadgeOrder = {
  id: string
  dealerId: string
  accountId: string
  dealerName: string
  city: string
  productId: string
  amount: number
  status: DealerBadgeStatus
  purchased: string
  renews: string
  grantedByAdmin?: boolean
  mpesaReference?: string
}

const STORAGE_KEY = 'kv-dealer-badges'
const EVENT = 'kv-dealer-badges-changed'

function today() {
  return new Date().toISOString().slice(0, 10)
}

function addMonths(isoDate: string, months: number) {
  const d = new Date(`${isoDate}T12:00:00`)
  d.setMonth(d.getMonth() + months)
  return d.toISOString().slice(0, 10)
}

function read(): DealerBadgeOrder[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as DealerBadgeOrder[]
  } catch {
    return []
  }
}

function write(rows: DealerBadgeOrder[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rows))
  syncDealerVerifiedFlags(rows)
  window.dispatchEvent(new Event(EVENT))
  window.dispatchEvent(new Event(BILLING_EVENT_NAME))
}

function syncDealerVerifiedFlags(rows: DealerBadgeOrder[]) {
  const now = today()
  for (const dealer of dealers) {
    const badge = rows.find((b) => b.dealerId === dealer.id)
    if (badge) {
      dealer.verified = badge.status === 'Active' && badge.renews >= now
    }
  }
}

function enforceExpiry(rows: DealerBadgeOrder[]) {
  const now = today()
  return rows.map((b) => {
    if (b.status === 'Active' && b.renews < now) {
      return { ...b, status: 'Expired' as const }
    }
    return b
  })
}

export function getDealerBadges() {
  const next = enforceExpiry(read())
  const prev = read()
  if (JSON.stringify(next) !== JSON.stringify(prev)) write(next)
  else syncDealerVerifiedFlags(next)
  return next
}

export function getDealerBadgeForAccount(accountId: string) {
  return getDealerBadges().find((b) => b.accountId === accountId) ?? null
}

export function getDealerBadgeForDealer(dealerId: string) {
  return getDealerBadges().find((b) => b.dealerId === dealerId) ?? null
}

export function isDealerBadgeActive(accountId: string) {
  const badge = getDealerBadgeForAccount(accountId)
  return Boolean(badge && badge.status === 'Active' && badge.renews >= today())
}

export function activateDealerBadge(input: {
  accountId: string
  dealerId: string
  dealerName: string
  city: string
  grantedByAdmin?: boolean
  mpesaReference?: string
}) {
  const rows = getDealerBadges()
  const existing = rows.find((b) => b.accountId === input.accountId)
  const start = today()
  // If still active, extend from current renews date; otherwise start today
  const base =
    existing && existing.status === 'Active' && existing.renews >= start
      ? existing.renews
      : start
  const row: DealerBadgeOrder = {
    id: existing?.id ?? `dbadge-${Date.now()}`,
    dealerId: input.dealerId,
    accountId: input.accountId,
    dealerName: input.dealerName,
    city: input.city,
    productId: verifiedBadgeProduct.id,
    amount: verifiedBadgeProduct.price,
    status: 'Active',
    purchased: existing?.purchased ?? start,
    renews: addMonths(base, VERIFIED_BADGE_DURATION_MONTHS),
    grantedByAdmin: Boolean(input.grantedByAdmin),
    mpesaReference: input.mpesaReference,
  }
  write(existing ? rows.map((b) => (b.accountId === input.accountId ? row : b)) : [row, ...rows])
  return row
}

export function revokeDealerBadge(accountId: string) {
  const rows = getDealerBadges()
  write(
    rows.map((b) =>
      b.accountId === accountId ? { ...b, status: 'Expired' as const, renews: today() } : b,
    ),
  )
}

export function subscribeDealerBadges(cb: () => void) {
  window.addEventListener(EVENT, cb)
  window.addEventListener('storage', cb)
  return () => {
    window.removeEventListener(EVENT, cb)
    window.removeEventListener('storage', cb)
  }
}

export function formatVerifiedBadgePrice() {
  return formatBillingKES(verifiedBadgeProduct.price)
}

// Keep older import names working for Pricing/Admin during transition
export const agentBadgeProducts = [
  {
    id: verifiedBadgeProduct.id,
    name: verifiedBadgeProduct.name,
    price: verifiedBadgeProduct.price,
    billing: 'Monthly' as const,
    perks: verifiedBadgeProduct.perks,
  },
]

getDealerBadges()
