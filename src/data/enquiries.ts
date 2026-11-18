export type EnquiryType = 'Car sale' | 'Loan'
export type EnquiryStatus = 'New' | 'Replied' | 'Accepted' | 'Declined' | 'Closed'

export type YardEnquiry = {
  id: string
  type: EnquiryType
  dealerId: string
  dealerName: string
  carId?: string
  carLabel: string
  /** Snapshot so loan agents can still see the unit later */
  carImage?: string
  carYear?: number
  carMake?: string
  carModel?: string
  carMileage?: number
  carCity?: string
  customerName: string
  customerPhone: string
  customerEmail?: string
  message: string
  loanPartnerId?: string
  loanPartnerName?: string
  depositPercent?: number
  termMonths?: number
  estimatedMonthly?: number
  carPrice?: number
  status: EnquiryStatus
  createdAt: string
  /** When a loan agent accepted or declined this request */
  lenderDecisionAt?: string
  lenderDecisionBy?: string
}

const STORAGE_KEY = 'kv-yard-enquiries'
const EVENT = 'kv-enquiries-changed'

function read(): YardEnquiry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as YardEnquiry[]
  } catch {
    return []
  }
}

function write(list: YardEnquiry[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
  window.dispatchEvent(new Event(EVENT))
}

export function getEnquiries() {
  return read().sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )
}

export function getEnquiriesForDealer(dealerId: string) {
  return getEnquiries().filter((e) => e.dealerId === dealerId)
}

export function getEnquiriesForLoanPartner(loanPartnerId: string) {
  return getEnquiries().filter(
    (e) => e.type === 'Loan' && e.loanPartnerId === loanPartnerId,
  )
}

export function submitEnquiry(
  input: Omit<YardEnquiry, 'id' | 'status' | 'createdAt'>,
): YardEnquiry {
  const next: YardEnquiry = {
    ...input,
    id: `enq-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    status: 'New',
    createdAt: new Date().toISOString(),
  }
  write([next, ...read()])
  return next
}

export function updateEnquiryStatus(id: string, status: EnquiryStatus) {
  write(read().map((e) => (e.id === id ? { ...e, status } : e)))
}

export function setLoanLenderDecision(
  id: string,
  decision: 'Accepted' | 'Declined',
  lenderName: string,
) {
  write(
    read().map((e) =>
      e.id === id
        ? {
            ...e,
            status: decision,
            lenderDecisionAt: new Date().toISOString(),
            lenderDecisionBy: lenderName,
          }
        : e,
    ),
  )
}

export function subscribeEnquiries(listener: () => void) {
  window.addEventListener(EVENT, listener)
  window.addEventListener('storage', listener)
  return () => {
    window.removeEventListener(EVENT, listener)
    window.removeEventListener('storage', listener)
  }
}
