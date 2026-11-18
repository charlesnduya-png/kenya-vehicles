export type BillingStatus = 'Active' | 'Past due' | 'Cancelled' | 'Trial'

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
}

export interface AgentPlan {
  id: string
  name: string
  monthlyPrice: number
  listingLimit: number
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

export const dealerPlans: DealerPlan[] = [
  {
    id: 'plan-starter',
    name: 'Starter',
    monthlyPrice: 4999,
    listingLimit: 15,
    featuredSlots: 1,
    perks: [
      'Up to 15 live car listings',
      'Dealer profile page',
      'Buyer enquiry inbox',
      'Basic analytics',
    ],
  },
  {
    id: 'plan-growth',
    name: 'Growth',
    monthlyPrice: 9999,
    listingLimit: 50,
    featuredSlots: 5,
    popular: true,
    perks: [
      'Up to 50 live listings',
      '5 featured homepage slots',
      'Loan partner attach on listings',
      'Priority support',
      'City targeting boost',
    ],
  },
  {
    id: 'plan-enterprise',
    name: 'Enterprise',
    monthlyPrice: 24999,
    listingLimit: 'Unlimited',
    featuredSlots: 20,
    perks: [
      'Unlimited listings',
      '20 featured slots',
      'Multi-branch accounts',
      'Dedicated account manager',
      'API & bulk upload',
    ],
  },
]

export const agentPlans: AgentPlan[] = [
  {
    id: 'agent-basic',
    name: 'Agent Basic',
    monthlyPrice: 2999,
    listingLimit: 8,
    perks: ['Up to 8 listings', 'Agent profile', 'Buyer enquiries'],
  },
  {
    id: 'agent-pro',
    name: 'Agent Pro',
    monthlyPrice: 5999,
    listingLimit: 25,
    perks: ['Up to 25 listings', 'Priority placement', 'Lead insights'],
  },
]

export const agentBadgeProducts: BadgeProduct[] = [
  {
    id: 'badge-monthly',
    name: 'Verified Agent Badge',
    price: 3500,
    billing: 'Monthly',
    perks: [
      'Verified badge on profile & listings',
      'Higher search ranking',
      'Trusted agent label for buyers',
      'Cancel anytime',
    ],
  },
  {
    id: 'badge-annual',
    name: 'Verified Agent Badge (Annual)',
    price: 35000,
    billing: 'Annual',
    perks: [
      'Everything in monthly badge',
      '2 months free vs monthly',
      'Annual trust audit certificate',
      'Featured in verified agents directory',
    ],
  },
]

export const dealerSubscriptions: DealerSubscription[] = [
  {
    id: 'sub1',
    dealerName: 'Summit Motors Kenya',
    accountId: 'u2',
    planId: 'plan-enterprise',
    planName: 'Enterprise',
    amount: 24999,
    status: 'Active',
    startDate: '2024-05-02',
    nextBilling: '2026-04-02',
    city: 'Nairobi',
  },
  {
    id: 'sub2',
    dealerName: 'Coastline Auto Hub',
    accountId: 'u3',
    planId: 'plan-growth',
    planName: 'Growth',
    amount: 9999,
    status: 'Active',
    startDate: '2024-08-19',
    nextBilling: '2026-04-19',
    city: 'Mombasa',
  },
  {
    id: 'sub3',
    dealerName: 'Lakeview Motors',
    accountId: 'u13',
    planId: 'plan-growth',
    planName: 'Growth',
    amount: 9999,
    status: 'Past due',
    startDate: '2025-01-10',
    nextBilling: '2026-03-10',
    city: 'Kisumu',
  },
  {
    id: 'sub4',
    dealerName: 'Rift Valley Autos',
    accountId: 'u14',
    planId: 'plan-starter',
    planName: 'Starter',
    amount: 4999,
    status: 'Active',
    startDate: '2025-03-01',
    nextBilling: '2026-04-01',
    city: 'Nakuru',
  },
  {
    id: 'sub5',
    dealerName: 'Highlands Drive',
    accountId: 'u15',
    planId: 'plan-enterprise',
    planName: 'Enterprise',
    amount: 24999,
    status: 'Active',
    startDate: '2024-11-12',
    nextBilling: '2026-04-12',
    city: 'Eldoret',
  },
  {
    id: 'sub6',
    dealerName: 'Capital City Cars',
    accountId: 'u9',
    planId: 'plan-starter',
    planName: 'Starter',
    amount: 4999,
    status: 'Trial',
    startDate: '2026-03-08',
    nextBilling: '2026-03-22',
    city: 'Nairobi',
  },
]

export const agentSubscriptions: AgentSubscription[] = [
  {
    id: 'asub1',
    agentName: 'Brian Kariuki Motors',
    accountId: 'u16',
    planId: 'agent-pro',
    planName: 'Agent Pro',
    amount: 5999,
    status: 'Active',
    startDate: '2025-11-02',
    nextBilling: '2026-04-02',
    city: 'Nairobi',
    grantedByAdmin: false,
  },
  {
    id: 'asub2',
    agentName: 'Faith Njeri Auto',
    accountId: 'u17',
    planId: 'agent-basic',
    planName: 'Agent Basic',
    amount: 2999,
    status: 'Active',
    startDate: '2026-02-14',
    nextBilling: '2026-04-14',
    city: 'Thika',
    grantedByAdmin: true,
  },
]

export const agentBadgeOrders: AgentBadgeOrder[] = [
  {
    id: 'badge1',
    agentName: 'Brian Kariuki Motors',
    accountId: 'u16',
    productId: 'badge-annual',
    amount: 35000,
    billing: 'Annual',
    status: 'Active',
    purchased: '2025-11-02',
    renews: '2026-11-02',
    city: 'Nairobi',
    grantedByAdmin: false,
  },
  {
    id: 'badge2',
    agentName: 'Faith Njeri Auto',
    accountId: 'u17',
    productId: 'badge-monthly',
    amount: 3500,
    billing: 'Monthly',
    status: 'Active',
    purchased: '2026-02-14',
    renews: '2026-04-14',
    city: 'Thika',
    grantedByAdmin: true,
  },
  {
    id: 'badge3',
    agentName: 'Coast Auto Agent',
    accountId: 'u18',
    productId: 'badge-monthly',
    amount: 3500,
    billing: 'Monthly',
    status: 'Pending payment',
    purchased: '2026-03-15',
    renews: '—',
    city: 'Mombasa',
    grantedByAdmin: false,
  },
  {
    id: 'badge4',
    agentName: 'Rift Car Broker',
    accountId: 'u19',
    productId: 'badge-annual',
    amount: 35000,
    billing: 'Annual',
    status: 'Expired',
    purchased: '2024-12-01',
    renews: '2025-12-01',
    city: 'Nakuru',
    grantedByAdmin: false,
  },
]

export function formatBillingKES(amount: number) {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    maximumFractionDigits: 0,
  }).format(amount)
}
