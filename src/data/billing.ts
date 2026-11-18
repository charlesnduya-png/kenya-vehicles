export type BillingStatus =
  | 'Active'
  | 'Past due'
  | 'Grace'
  | 'Frozen'
  | 'Cancelled'
  | 'Trial'

/** Days of free advance after a missed payment before the account freezes */
export const PAYMENT_GRACE_DAYS = 3

export interface DealerPlan {
  id: string
  name: string
  monthlyPrice: number
  listingLimit: number | 'Unlimited'
  featuredSlots: number
  perks: string[]
  popular?: boolean
}

export interface BadgeProduct {
  id: string
  name: string
  price: number
  billing: 'Monthly' | 'Annual'
  perks: string[]
}

export interface DealerSubscription {
  id: string
  dealerName: string
  accountId: string
  planId: string
  planName: string
  amount: number
  status: BillingStatus
  startDate: string
  nextBilling: string
  city: string
  /** ISO date — end of 3-day advance after missed payment */
  graceUntil?: string | null
  frozenAt?: string | null
}

export interface LenderSubscription {
  id: string
  lenderName: string
  accountId: string
  planId: string
  planName: string
  amount: number
  status: BillingStatus
  startDate: string
  nextBilling: string
  city: string
  graceUntil?: string | null
  frozenAt?: string | null
}

export interface AgentPlan {
  id: string
  name: string
  monthlyPrice: number
  listingLimit: number | 'Unlimited'
  perks: string[]
}

export interface AgentSubscription {
  id: string
  agentName: string
  accountId: string
  planId: string
  planName: string
  amount: number
  status: BillingStatus
  startDate: string
  nextBilling: string
  city: string
  grantedByAdmin: boolean
}

export interface AgentBadgeOrder {
  id: string
  agentName: string
  accountId: string
  productId: string
  amount: number
  billing: 'Monthly' | 'Annual'
  status: 'Active' | 'Pending payment' | 'Expired'
  purchased: string
  renews: string
  city: string
  grantedByAdmin: boolean
}

/** Flat monthly price for every subscription account */
export const SUBSCRIPTION_PRICE_KES = 2000

export const dealerPlans: DealerPlan[] = [
  {
    id: 'plan-dealer',
    name: 'Dealer',
    monthlyPrice: SUBSCRIPTION_PRICE_KES,
    listingLimit: 'Unlimited',
    featuredSlots: 10,
    popular: true,
    perks: [
      'Unlimited car listings',
      'Unlimited hire-car listings',
      'Dealer profile page',
      'Buyer enquiry & message inbox',
      'Loan partner attach on listings',
      `${PAYMENT_GRACE_DAYS}-day advance if payment fails, then account freezes`,
    ],
  },
]

export const lenderPlans: DealerPlan[] = [
  {
    id: 'plan-lender',
    name: 'Lender',
    monthlyPrice: SUBSCRIPTION_PRICE_KES,
    listingLimit: 'Unlimited',
    featuredSlots: 0,
    popular: true,
    perks: [
      'Loan applications inbox',
      'Partner profile for dealers & buyers',
      'Analytics dashboard',
      `${PAYMENT_GRACE_DAYS}-day advance if payment fails, then account freezes`,
    ],
  },
]

export const agentPlans: AgentPlan[] = [
  {
    id: 'agent-standard',
    name: 'Agent',
    monthlyPrice: SUBSCRIPTION_PRICE_KES,
    listingLimit: 'Unlimited',
    perks: ['Unlimited listings', 'Agent profile', 'Buyer enquiries', 'Priority placement'],
  },
]

/** Dealer verified badge — renewable every 2 months */
export const agentBadgeProducts: BadgeProduct[] = [
  {
    id: 'badge-verified-2m',
    name: 'Verified Dealer Badge',
    price: SUBSCRIPTION_PRICE_KES,
    billing: 'Monthly',
    perks: [
      'Verified badge on yard profile & listings',
      'Higher trust with buyers',
      'Renewable every 2 months',
      'Buy from your dealer account anytime',
    ],
  },
]

const seedDealerSubscriptions: DealerSubscription[] = []

const seedLenderSubscriptions: LenderSubscription[] = []

const seedAgentSubscriptions: AgentSubscription[] = []

export const agentBadgeOrders: AgentBadgeOrder[] = []

const DEALER_SUBS_KEY = 'kv-dealer-subscriptions'
const LENDER_SUBS_KEY = 'kv-lender-subscriptions'
const AGENT_SUBS_KEY = 'kv-agent-subscriptions'
export const BILLING_EVENT_NAME = 'kv-billing-changed'
const BILLING_EVENT = BILLING_EVENT_NAME

function today() {
  return new Date().toISOString().slice(0, 10)
}

function nextMonth() {
  const d = new Date()
  d.setMonth(d.getMonth() + 1)
  return d.toISOString().slice(0, 10)
}

function addDays(isoDate: string, days: number) {
  const d = new Date(`${isoDate}T12:00:00`)
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

function daysBetween(fromIso: string, toIso: string) {
  const a = new Date(`${fromIso}T12:00:00`).getTime()
  const b = new Date(`${toIso}T12:00:00`).getTime()
  return Math.ceil((b - a) / (24 * 60 * 60 * 1000))
}

function readList<T>(key: string, seed: T[]): T[] {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return seed.map((row) => ({ ...row }))
    return JSON.parse(raw) as T[]
  } catch {
    return seed.map((row) => ({ ...row }))
  }
}

function writeList<T>(key: string, rows: T[]) {
  localStorage.setItem(key, JSON.stringify(rows))
  window.dispatchEvent(new Event(BILLING_EVENT))
}

export function getDealerSubscriptions(): DealerSubscription[] {
  return readList(DEALER_SUBS_KEY, seedDealerSubscriptions)
}

export function getLenderSubscriptions(): LenderSubscription[] {
  return readList(LENDER_SUBS_KEY, seedLenderSubscriptions)
}

export function getAgentSubscriptions(): AgentSubscription[] {
  return readList(AGENT_SUBS_KEY, seedAgentSubscriptions)
}

/** Seed export kept for admin seed imports */
export const dealerSubscriptions = seedDealerSubscriptions
export const lenderSubscriptions = seedLenderSubscriptions
export const agentSubscriptions = seedAgentSubscriptions

export function getDealerSubscriptionForAccount(accountId: string) {
  return getDealerSubscriptions().find((s) => s.accountId === accountId) ?? null
}

export function getLenderSubscriptionForAccount(accountId: string) {
  return getLenderSubscriptions().find((s) => s.accountId === accountId) ?? null
}

export function dealerSubscriptionIsPaid(status: BillingStatus) {
  return status === 'Active' || status === 'Trial'
}

export function subscriptionAllowsAccess(status: BillingStatus) {
  return status === 'Active' || status === 'Trial' || status === 'Grace'
}

type AnySub = DealerSubscription | LenderSubscription

function applyBillingRules<T extends AnySub>(sub: T, now = today()): T {
  let next: T = { ...sub }

  if (next.status === 'Cancelled' || next.status === 'Frozen') {
    if (next.status === 'Frozen' && !next.frozenAt) next = { ...next, frozenAt: now }
    return next
  }

  // Missed renewal while still Active/Trial → start 3-day advance
  if (
    (next.status === 'Active' || next.status === 'Trial') &&
    next.nextBilling &&
    next.nextBilling < now
  ) {
    next = {
      ...next,
      status: 'Grace',
      graceUntil: addDays(now, PAYMENT_GRACE_DAYS),
      frozenAt: null,
    }
  }

  // Explicit past due → start grace window
  if (next.status === 'Past due') {
    next = {
      ...next,
      status: 'Grace',
      graceUntil: next.graceUntil && next.graceUntil >= now ? next.graceUntil : addDays(now, PAYMENT_GRACE_DAYS),
      frozenAt: null,
    }
  }

  // Grace expired → freeze
  if (next.status === 'Grace') {
    const until = next.graceUntil || addDays(now, PAYMENT_GRACE_DAYS)
    if (!next.graceUntil) next = { ...next, graceUntil: until }
    if (until < now) {
      next = {
        ...next,
        status: 'Frozen',
        frozenAt: now,
      }
    }
  }

  return next
}

function sameSubState(a: AnySub, b: AnySub) {
  return (
    a.status === b.status &&
    (a.graceUntil || null) === (b.graceUntil || null) &&
    (a.frozenAt || null) === (b.frozenAt || null)
  )
}

/** Apply overdue → 3-day grace → freeze rules to all partner subscriptions */
export function enforceBillingStates() {
  const dealers = getDealerSubscriptions()
  const lenders = getLenderSubscriptions()
  const nextDealers = dealers.map((s) => applyBillingRules(s))
  const nextLenders = lenders.map((s) => applyBillingRules(s))
  const dealersChanged = nextDealers.some((s, i) => !sameSubState(s, dealers[i]))
  const lendersChanged = nextLenders.some((s, i) => !sameSubState(s, lenders[i]))
  if (dealersChanged) writeList(DEALER_SUBS_KEY, nextDealers)
  if (lendersChanged) writeList(LENDER_SUBS_KEY, nextLenders)
  return { dealers: nextDealers, lenders: nextLenders }
}

export function getGraceDaysLeft(sub: { status: BillingStatus; graceUntil?: string | null }) {
  if (sub.status !== 'Grace' || !sub.graceUntil) return 0
  return Math.max(0, daysBetween(today(), sub.graceUntil))
}

export function activateDealerSubscription(input: {
  accountId: string
  dealerName: string
  city: string
}) {
  const plan = dealerPlans[0]
  const rows = getDealerSubscriptions()
  const existing = rows.find((s) => s.accountId === input.accountId)
  const row: DealerSubscription = {
    id: existing?.id ?? `sub-${Date.now()}`,
    dealerName: input.dealerName,
    accountId: input.accountId,
    planId: plan.id,
    planName: plan.name,
    amount: plan.monthlyPrice,
    status: 'Active',
    startDate: existing?.startDate ?? today(),
    nextBilling: nextMonth(),
    city: input.city,
    graceUntil: null,
    frozenAt: null,
  }
  if (existing) {
    writeList(
      DEALER_SUBS_KEY,
      rows.map((s) => (s.accountId === input.accountId ? row : s)),
    )
  } else {
    writeList(DEALER_SUBS_KEY, [row, ...rows])
  }
  return row
}

export function activateLenderSubscription(input: {
  accountId: string
  lenderName: string
  city: string
}) {
  const plan = lenderPlans[0]
  const rows = getLenderSubscriptions()
  const existing = rows.find((s) => s.accountId === input.accountId)
  const row: LenderSubscription = {
    id: existing?.id ?? `lsub-${Date.now()}`,
    lenderName: input.lenderName,
    accountId: input.accountId,
    planId: plan.id,
    planName: plan.name,
    amount: plan.monthlyPrice,
    status: 'Active',
    startDate: existing?.startDate ?? today(),
    nextBilling: nextMonth(),
    city: input.city,
    graceUntil: null,
    frozenAt: null,
  }
  if (existing) {
    writeList(
      LENDER_SUBS_KEY,
      rows.map((s) => (s.accountId === input.accountId ? row : s)),
    )
  } else {
    writeList(LENDER_SUBS_KEY, [row, ...rows])
  }
  return row
}

export function setDealerSubscriptionStatus(accountId: string, status: BillingStatus) {
  const rows = getDealerSubscriptions()
  const now = today()
  writeList(
    DEALER_SUBS_KEY,
    rows.map((s) => {
      if (s.accountId !== accountId) return s
      if (status === 'Past due' || status === 'Grace') {
        return applyBillingRules({
          ...s,
          status: 'Past due',
          graceUntil: null,
          frozenAt: null,
        })
      }
      if (status === 'Frozen') {
        return { ...s, status: 'Frozen', frozenAt: s.frozenAt || now }
      }
      if (status === 'Active' || status === 'Trial') {
        return {
          ...s,
          status,
          graceUntil: null,
          frozenAt: null,
          nextBilling: status === 'Active' ? nextMonth() : s.nextBilling,
        }
      }
      return { ...s, status }
    }),
  )
}

export function setLenderSubscriptionStatus(accountId: string, status: BillingStatus) {
  const rows = getLenderSubscriptions()
  const now = today()
  writeList(
    LENDER_SUBS_KEY,
    rows.map((s) => {
      if (s.accountId !== accountId) return s
      if (status === 'Past due' || status === 'Grace') {
        return applyBillingRules({
          ...s,
          status: 'Past due',
          graceUntil: null,
          frozenAt: null,
        })
      }
      if (status === 'Frozen') {
        return { ...s, status: 'Frozen', frozenAt: s.frozenAt || now }
      }
      if (status === 'Active' || status === 'Trial') {
        return {
          ...s,
          status,
          graceUntil: null,
          frozenAt: null,
          nextBilling: status === 'Active' ? nextMonth() : s.nextBilling,
        }
      }
      return { ...s, status }
    }),
  )
}

export function saveAgentSubscriptions(rows: AgentSubscription[]) {
  writeList(AGENT_SUBS_KEY, rows)
}

export function subscribeBilling(cb: () => void) {
  window.addEventListener(BILLING_EVENT, cb)
  window.addEventListener('storage', cb)
  return () => {
    window.removeEventListener(BILLING_EVENT, cb)
    window.removeEventListener('storage', cb)
  }
}

export function formatBillingKES(amount: number) {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    maximumFractionDigits: 0,
  }).format(amount)
}
