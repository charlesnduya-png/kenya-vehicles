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

export const adminAccounts: AdminAccount[] = [
  {
    id: 'u1',
    name: 'Jane Wanjiku',
    email: 'jane.w@gmail.com',
    phone: '+254 712 111 001',
    role: 'Buyer',
    status: 'Active',
    city: 'Nairobi',
    joined: '2026-01-12',
    lastActive: '2026-03-17',
  },
  {
    id: 'u2',
    name: 'Summit Motors Kenya',
    email: 'sales@summitmotors.co.ke',
    phone: '+254 712 340 001',
    role: 'Dealer',
    status: 'Active',
    city: 'Nairobi',
    joined: '2024-05-02',
    lastActive: '2026-03-17',
    plan: 'Enterprise',
    billingStatus: 'Active',
  },
  {
    id: 'u3',
    name: 'Coastline Auto Hub',
    email: 'hello@coastlineauto.co.ke',
    phone: '+254 722 881 220',
    role: 'Dealer',
    status: 'Active',
    city: 'Mombasa',
    joined: '2024-08-19',
    lastActive: '2026-03-16',
    plan: 'Growth',
    billingStatus: 'Active',
  },
  {
    id: 'u6',
    name: 'Equity Bank Auto',
    email: 'auto@equitybank.co.ke',
    phone: '+254 763 000 111',
    role: 'Loan partner',
    status: 'Active',
    city: 'Nairobi',
    joined: '2024-11-01',
    lastActive: '2026-03-14',
  },
  {
    id: 'u7',
    name: 'CarFin KE',
    email: 'partners@carfin.ke',
    phone: '+254 790 222 333',
    role: 'Loan partner',
    status: 'Active',
    city: 'Nairobi',
    joined: '2026-03-01',
    lastActive: '2026-03-10',
  },
  {
    id: 'u7b',
    name: 'KCB Drive',
    email: 'drive@kcbgroup.com',
    phone: '+254 711 012 000',
    role: 'Loan partner',
    status: 'Active',
    city: 'Nairobi',
    joined: '2025-02-12',
    lastActive: '2026-03-17',
  },
  {
    id: 'u7c',
    name: 'Stima Sacco Auto',
    email: 'auto@stimasacco.com',
    phone: '+254 709 663 000',
    role: 'Loan partner',
    status: 'Active',
    city: 'Nairobi',
    joined: '2025-06-01',
    lastActive: '2026-03-16',
  },
  {
    id: 'u8',
    name: 'Peter Otieno',
    email: 'peter.o@yahoo.com',
    phone: '+254 734 555 666',
    role: 'Buyer',
    status: 'Active',
    city: 'Kisumu',
    joined: '2025-09-18',
    lastActive: '2026-03-12',
  },
  {
    id: 'u9',
    name: 'Capital City Cars',
    email: 'desk@capitalcitycars.co.ke',
    phone: '+254 798 112 334',
    role: 'Dealer',
    status: 'Pending',
    city: 'Nairobi',
    joined: '2026-03-08',
    lastActive: '2026-03-09',
    plan: 'Starter',
    billingStatus: 'Trial',
  },
  {
    id: 'u16',
    name: 'Brian Kariuki Motors',
    email: 'brian@kariukimotors.ke',
    phone: '+254 711 555 101',
    role: 'Agent',
    status: 'Active',
    city: 'Nairobi',
    joined: '2025-11-02',
    lastActive: '2026-03-17',
    plan: 'Verified Badge (Annual)',
    billingStatus: 'Active',
    verifiedBadge: true,
  },
  {
    id: 'u17',
    name: 'Faith Njeri Auto',
    email: 'faith@njeri.auto',
    phone: '+254 722 555 202',
    role: 'Agent',
    status: 'Active',
    city: 'Thika',
    joined: '2026-02-14',
    lastActive: '2026-03-16',
    plan: 'Verified Badge',
    billingStatus: 'Active',
    verifiedBadge: true,
  },
  {
    id: 'u18',
    name: 'Coast Auto Agent',
    email: 'agent@coastauto.ke',
    phone: '+254 733 555 303',
    role: 'Agent',
    status: 'Pending',
    city: 'Mombasa',
    joined: '2026-03-15',
    lastActive: '2026-03-15',
    plan: 'Verified Badge',
    billingStatus: 'Past due',
    verifiedBadge: false,
  },
  {
    id: 'u10',
    name: 'KV Platform Admin',
    email: 'admin@kenyavehicles.co.ke',
    phone: '+254 700 000 001',
    role: 'Admin',
    status: 'Active',
    city: 'Nairobi',
    joined: '2024-01-01',
    lastActive: '2026-03-17',
  },
  {
    id: 'u12',
    name: 'Amina Hassan',
    email: 'amina.h@outlook.com',
    phone: '+254 745 777 888',
    role: 'Buyer',
    status: 'Active',
    city: 'Mombasa',
    joined: '2026-02-14',
    lastActive: '2026-03-16',
  },
]

export const adminEnquiries: AdminEnquiry[] = [
  {
    id: 'e1',
    type: 'Car sale',
    customer: 'Jane Wanjiku',
    phone: '+254 712 111 001',
    subject: 'Is the 2018 Harrier still available?',
    related: 'c1 · Summit Motors',
    status: 'New',
    created: '2026-03-17 09:14',
    assignee: 'Unassigned',
  },
  {
    id: 'e2',
    type: 'Car hire',
    customer: 'Amina Hassan',
    phone: '+254 745 777 888',
    subject: '3-day CX-5 hire with driver',
    related: 'r7 · Safari Wheels',
    status: 'In progress',
    created: '2026-03-17 08:02',
    assignee: 'Ops desk',
  },
  {
    id: 'e3',
    type: 'Loan',
    customer: 'Peter Otieno',
    phone: '+254 734 555 666',
    subject: 'Pre-approval for KES 2.9M CX-5',
    related: 'Equity Bank Auto',
    status: 'In progress',
    created: '2026-03-16 16:40',
    assignee: 'Finance desk',
  },
  {
    id: 'e4',
    type: 'Partnership',
    customer: 'CarFin KE',
    phone: '+254 790 222 333',
    subject: 'Lender onboarding documents',
    related: 'Loan partner application',
    status: 'New',
    created: '2026-03-16 11:20',
    assignee: 'Partnerships',
  },
  {
    id: 'e5',
    type: 'Car sale',
    customer: 'Brian Mwangi',
    phone: '+254 701 999 000',
    subject: 'Viewing request — Prado Eldoret',
    related: 'c2 · Highlands Drive',
    status: 'Closed',
    created: '2026-03-15 14:05',
    assignee: 'Sales desk',
  },
  {
    id: 'e6',
    type: 'Car hire',
    customer: 'Tour group LEA',
    phone: '+254 722 333 444',
    subject: 'Hiace 5-day coast tour',
    related: 'r6 · Coast Ride',
    status: 'New',
    created: '2026-03-17 10:31',
    assignee: 'Unassigned',
  },
  {
    id: 'e7',
    type: 'Partnership',
    customer: 'Capital City Cars',
    phone: '+254 798 112 334',
    subject: 'Dealer verification pending',
    related: 'Dealer application',
    status: 'In progress',
    created: '2026-03-09 09:00',
    assignee: 'Partnerships',
  },
]

export const adminActivity = [
  { time: '10:41', text: 'New hire request — Toyota Hiace (Mombasa)' },
  { time: '09:14', text: 'Buyer enquiry on 2018 Toyota Harrier' },
  { time: '08:55', text: 'Dealer Summit Motors renewed Enterprise plan' },
  { time: '08:20', text: 'Agent Faith Njeri Auto billed for Verified Badge' },
  { time: '08:02', text: 'Hire booking in progress — Mazda CX-5' },
  { time: 'Yesterday', text: 'Coast Auto Agent badge payment pending' },
  { time: 'Yesterday', text: 'Lakeview Motors Growth plan past due' },
  { time: 'Mar 15', text: 'Prado viewing closed as sold lead' },
  { time: 'Mar 14', text: 'Rift Self Drive account suspended for review' },
]

export const monthlyStats = [
  { label: 'Oct', sales: 42, hires: 68, loans: 19 },
  { label: 'Nov', sales: 51, hires: 74, loans: 23 },
  { label: 'Dec', sales: 63, hires: 91, loans: 31 },
  { label: 'Jan', sales: 58, hires: 86, loans: 27 },
  { label: 'Feb', sales: 71, hires: 102, loans: 34 },
  { label: 'Mar', sales: 66, hires: 97, loans: 29 },
]
