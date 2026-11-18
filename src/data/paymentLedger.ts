import { BILLING_EVENT_NAME, SUBSCRIPTION_PRICE_KES } from './billing'

export type PaymentAttemptStatus = 'QUEUED' | 'SUCCESS' | 'FAILED'

export type PaymentRecord = {
  id: string
  reference: string
  externalReference?: string
  accountId: string
  partnerKind: 'dealer' | 'lender'
  partnerName: string
  city?: string
  phone: string
  amount: number
  /** Always monthly for Kenya Vehicles subscriptions */
  billingPeriod: 'monthly'
  status: PaymentAttemptStatus
  mpesaReference?: string
  createdAt: string
  updatedAt: string
  /** system = PayHero/status poll; admin = manual open */
  confirmedBy?: 'system' | 'admin'
  note?: string
}

const STORAGE_KEY = 'kv-payment-ledger'
const EVENT = 'kv-payment-ledger-changed'

function nowIso() {
  return new Date().toISOString()
}

function read(): PaymentRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as PaymentRecord[]
  } catch {
    return []
  }
}

function write(rows: PaymentRecord[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rows))
  window.dispatchEvent(new Event(EVENT))
  window.dispatchEvent(new Event(BILLING_EVENT_NAME))
}

export function getPaymentRecords() {
  return read().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}

export function getFailedPayments() {
  return getPaymentRecords().filter((p) => p.status === 'FAILED')
}

export function recordPaymentStarted(input: {
  reference: string
  externalReference?: string
  accountId: string
  partnerKind: 'dealer' | 'lender'
  partnerName: string
  city?: string
  phone: string
  amount?: number
}) {
  const rows = read()
  const existing = rows.find((r) => r.reference === input.reference)
  const row: PaymentRecord = {
    id: existing?.id ?? `pay-${Date.now()}`,
    reference: input.reference,
    externalReference: input.externalReference,
    accountId: input.accountId,
    partnerKind: input.partnerKind,
    partnerName: input.partnerName,
    city: input.city,
    phone: input.phone,
    amount: input.amount ?? SUBSCRIPTION_PRICE_KES,
    billingPeriod: 'monthly',
    status: 'QUEUED',
    createdAt: existing?.createdAt ?? nowIso(),
    updatedAt: nowIso(),
    confirmedBy: 'system',
    note: 'Monthly subscription STK sent — waiting for M-Pesa PIN',
  }
  write(existing ? rows.map((r) => (r.reference === input.reference ? row : r)) : [row, ...rows])
  return row
}

export function confirmPaymentStatus(input: {
  reference: string
  status: PaymentAttemptStatus
  mpesaReference?: string | null
  note?: string
}) {
  const rows = read()
  const existing = rows.find((r) => r.reference === input.reference)
  if (!existing) return null

  const row: PaymentRecord = {
    ...existing,
    status: input.status,
    mpesaReference: input.mpesaReference || existing.mpesaReference,
    updatedAt: nowIso(),
    confirmedBy: 'system',
    note:
      input.note ||
      (input.status === 'SUCCESS'
        ? 'System confirmed monthly payment success'
        : input.status === 'FAILED'
          ? 'System confirmed payment failed or was cancelled'
          : existing.note),
  }
  write(rows.map((r) => (r.reference === input.reference ? row : r)))
  return row
}

export function recordAdminManualOpen(input: {
  accountId: string
  partnerKind: 'dealer' | 'lender'
  partnerName: string
  city?: string
  note?: string
  relatedReference?: string
}) {
  const row: PaymentRecord = {
    id: `pay-admin-${Date.now()}`,
    reference: input.relatedReference || `ADMIN-${input.accountId}-${Date.now()}`,
    accountId: input.accountId,
    partnerKind: input.partnerKind,
    partnerName: input.partnerName,
    city: input.city,
    phone: '—',
    amount: SUBSCRIPTION_PRICE_KES,
    billingPeriod: 'monthly',
    status: 'SUCCESS',
    createdAt: nowIso(),
    updatedAt: nowIso(),
    confirmedBy: 'admin',
    note:
      input.note ||
      'Admin opened monthly access manually after failed or missing payment',
  }
  write([row, ...read()])
  return row
}

export function subscribePaymentLedger(cb: () => void) {
  window.addEventListener(EVENT, cb)
  window.addEventListener('storage', cb)
  return () => {
    window.removeEventListener(EVENT, cb)
    window.removeEventListener('storage', cb)
  }
}
