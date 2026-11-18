export type AccountRole =
  | 'Buyer'
  | 'Dealer'
  | 'Agent'
  | 'Loan partner'
  | 'Admin'

export type AccountStatus = 'Active' | 'Pending' | 'Suspended'

export interface AdminAccount {
  id: string
  name: string
  email: string
  phone: string
  role: AccountRole
  status: AccountStatus
  city: string
  joined: string
  lastActive: string
  /** Dealer monthly plan name, or Agent verified badge status */
  plan?: string
  billingStatus?: 'Active' | 'Past due' | 'Cancelled' | 'Trial' | 'None'
  verifiedBadge?: boolean
}

export type EnquiryType = 'Car sale' | 'Car hire' | 'Loan' | 'Partnership'
export type EnquiryStatus = 'New' | 'In progress' | 'Closed'

export interface AdminEnquiry {
  id: string
  type: EnquiryType
  customer: string
  phone: string
  subject: string
  related: string
  status: EnquiryStatus
  created: string
  assignee: string
}

/** Platform accounts — admin only in seed; dealers/lenders come from Join. */
export const adminAccounts: AdminAccount[] = [
  {
    id: 'u10',
    name: 'Charles Nduya',
    email: 'charlesnduya84@gmail.com',
    phone: '0792 268 513',
    role: 'Admin',
    status: 'Active',
    city: 'Nairobi',
    joined: '2024-01-01',
    lastActive: new Date().toISOString().slice(0, 10),
  },
]

export const adminEnquiries: AdminEnquiry[] = []

export const adminActivity: { time: string; text: string }[] = []

export const monthlyStats = [
  { label: 'Oct', sales: 0, hires: 0, loans: 0 },
  { label: 'Nov', sales: 0, hires: 0, loans: 0 },
  { label: 'Dec', sales: 0, hires: 0, loans: 0 },
  { label: 'Jan', sales: 0, hires: 0, loans: 0 },
  { label: 'Feb', sales: 0, hires: 0, loans: 0 },
  { label: 'Mar', sales: 0, hires: 0, loans: 0 },
]
