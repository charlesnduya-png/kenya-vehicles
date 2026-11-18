export type ReportReason =
  | 'Fraud / scam'
  | 'Fake or misleading listing'
  | 'Harassment'
  | 'Impersonation'
  | 'Spam'
  | 'Other'

export type ReportTargetType = 'Dealer' | 'Rental partner' | 'Agent' | 'Other account'

export type ReportStatus = 'New' | 'Under review' | 'Resolved' | 'Dismissed'

export type AccountReport = {
  id: string
  targetType: ReportTargetType
  targetId: string
  targetName: string
  reason: ReportReason
  details: string
  reporterName: string
  reporterPhone: string
  reporterEmail: string
  status: ReportStatus
  createdAt: string
  relatedListing?: string
}

const STORAGE_KEY = 'kv-account-reports'
const EVENT = 'kv-reports-changed'

const seed: AccountReport[] = [
  {
    id: 'rep1',
    targetType: 'Dealer',
    targetId: 'd6',
    targetName: 'Capital City Cars',
    reason: 'Fake or misleading listing',
    details: 'Price changed after I visited the yard and did not match the listing.',
    reporterName: 'Jane Wanjiku',
    reporterPhone: '+254 712 111 001',
    reporterEmail: 'jane.w@gmail.com',
    status: 'Under review',
    createdAt: '2026-03-16T10:20:00.000Z',
    relatedListing: 'c14 Nissan Note',
  },
]

function read(): AccountReport[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seed))
      return seed.map((r) => ({ ...r }))
    }
    return JSON.parse(raw) as AccountReport[]
  } catch {
    return seed.map((r) => ({ ...r }))
  }
}

function write(list: AccountReport[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
  window.dispatchEvent(new Event(EVENT))
}

export function getReports() {
  return read()
}

export function submitReport(input: Omit<AccountReport, 'id' | 'status' | 'createdAt'>) {
  const next: AccountReport = {
    ...input,
    id: `rep-${Date.now()}`,
    status: 'New',
    createdAt: new Date().toISOString(),
  }
  write([next, ...read()])
  return next
}

export function updateReportStatus(id: string, status: ReportStatus) {
  write(read().map((r) => (r.id === id ? { ...r, status } : r)))
}

export function subscribeReports(listener: () => void) {
  window.addEventListener(EVENT, listener)
  window.addEventListener('storage', listener)
  return () => {
    window.removeEventListener(EVENT, listener)
    window.removeEventListener('storage', listener)
  }
}

export const reportReasons: ReportReason[] = [
  'Fraud / scam',
  'Fake or misleading listing',
  'Harassment',
  'Impersonation',
  'Spam',
  'Other',
]
