import { adminEnquiries } from './admin'
import { formatKES, getCars } from './cars'
import { dealers } from './dealers'
import { getEnquiries, type YardEnquiry } from './enquiries'
import { loanPartners } from './loans'
import { getOffers } from './offers'

export type ApplicationBreakdown = {
  total: number
  carSale: number
  loan: number
  newCount: number
  replied: number
  closed: number
  adminLoanPipeline: number
  estimatedLoanMonthlyValue: number
}

export type DealerLeader = {
  id: string
  name: string
  city: string
  verified: boolean
  rating: number
  listings: number
  inventoryValue: number
  saleEnquiries: number
  loanEnquiries: number
  offers: number
  acceptedOffers: number
  score: number
}

export type LenderLeader = {
  id: string
  name: string
  type: string
  rating: number
  reviewCount: number
  applications: number
  newApplications: number
  closedApplications: number
  estimatedMonthlyVolume: number
  score: number
}

function liveEnquiries(): YardEnquiry[] {
  return getEnquiries()
}

export function getApplicationBreakdown(): ApplicationBreakdown {
  const rows = liveEnquiries()
  const loanRows = rows.filter((e) => e.type === 'Loan')
  const adminLoanPipeline = adminEnquiries.filter(
    (e) => e.type === 'Loan' && e.status !== 'Closed',
  ).length

  return {
    total: rows.length,
    carSale: rows.filter((e) => e.type === 'Car sale').length,
    loan: loanRows.length,
    newCount: rows.filter((e) => e.status === 'New').length,
    replied: rows.filter((e) => e.status === 'Replied').length,
    closed: rows.filter(
      (e) => e.status === 'Closed' || e.status === 'Accepted' || e.status === 'Declined',
    ).length,
    adminLoanPipeline,
    estimatedLoanMonthlyValue: loanRows.reduce(
      (sum, e) => sum + (e.estimatedMonthly ?? 0),
      0,
    ),
  }
}

export function getLeadingDealers(limit = 6): DealerLeader[] {
  const enquiries = liveEnquiries()
  const offers = getOffers()

  return dealers
    .map((dealer) => {
      const stock = getCars().filter((c) => c.dealerId === dealer.id)
      const dealerEnquiries = enquiries.filter((e) => e.dealerId === dealer.id)
      const saleEnquiries = dealerEnquiries.filter((e) => e.type === 'Car sale').length
      const loanEnquiries = dealerEnquiries.filter((e) => e.type === 'Loan').length
      const dealerOffers = offers.filter((o) => o.dealerId === dealer.id)
      const acceptedOffers = dealerOffers.filter((o) => o.status === 'Accepted').length
      const inventoryValue = stock.reduce((sum, c) => sum + c.price, 0)

      const score =
        saleEnquiries * 12 +
        loanEnquiries * 10 +
        dealerOffers.length * 8 +
        acceptedOffers * 15 +
        stock.length * 4 +
        dealer.rating * 6 +
        (dealer.verified ? 8 : 0)

      return {
        id: dealer.id,
        name: dealer.name,
        city: dealer.city,
        verified: dealer.verified,
        rating: dealer.rating,
        listings: stock.length,
        inventoryValue,
        saleEnquiries,
        loanEnquiries,
        offers: dealerOffers.length,
        acceptedOffers,
        score: Math.round(score * 10) / 10,
      }
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
}

export function getLeadingLenders(limit = 6): LenderLeader[] {
  const loanApps = liveEnquiries().filter((e) => e.type === 'Loan')

  return loanPartners
    .map((partner) => {
      const apps = loanApps.filter((e) => e.loanPartnerId === partner.id)
      const newApplications = apps.filter((e) => e.status === 'New').length
      const closedApplications = apps.filter(
        (e) => e.status === 'Closed' || e.status === 'Accepted' || e.status === 'Declined',
      ).length
      const estimatedMonthlyVolume = apps.reduce(
        (sum, e) => sum + (e.estimatedMonthly ?? 0),
        0,
      )

      const score =
        apps.length * 14 +
        newApplications * 6 +
        closedApplications * 4 +
        partner.rating * 8 +
        Math.min(partner.reviewCount / 20, 10)

      return {
        id: partner.id,
        name: partner.name,
        type: partner.type,
        rating: partner.rating,
        reviewCount: partner.reviewCount,
        applications: apps.length,
        newApplications,
        closedApplications,
        estimatedMonthlyVolume,
        score: Math.round(score * 10) / 10,
      }
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
}

export function getLenderOwnAnalytics(loanPartnerId: string) {
  const apps = liveEnquiries().filter(
    (e) => e.type === 'Loan' && e.loanPartnerId === loanPartnerId,
  )
  const byStatus = {
    newCount: apps.filter((e) => e.status === 'New').length,
    replied: apps.filter((e) => e.status === 'Replied').length,
    accepted: apps.filter((e) => e.status === 'Accepted').length,
    declined: apps.filter((e) => e.status === 'Declined').length,
    closed: apps.filter((e) => e.status === 'Closed').length,
  }
  const estimatedMonthlyVolume = apps.reduce((sum, e) => sum + (e.estimatedMonthly ?? 0), 0)
  const financedValue = apps
    .filter((e) => e.status === 'Accepted')
    .reduce((sum, e) => sum + (e.carPrice ?? 0), 0)

  const yardMap = new Map<
    string,
    { dealerId: string; dealerName: string; count: number; accepted: number }
  >()
  for (const app of apps) {
    const key = app.dealerId
    const prev = yardMap.get(key) ?? {
      dealerId: app.dealerId,
      dealerName: app.dealerName,
      count: 0,
      accepted: 0,
    }
    prev.count += 1
    if (app.status === 'Accepted') prev.accepted += 1
    yardMap.set(key, prev)
  }
  const topYards = [...yardMap.values()].sort((a, b) => b.count - a.count).slice(0, 6)

  const unitMap = new Map<string, { label: string; carId?: string; count: number; price?: number }>()
  for (const app of apps) {
    const key = app.carId ?? app.carLabel
    const prev = unitMap.get(key) ?? {
      label: app.carLabel,
      carId: app.carId,
      count: 0,
      price: app.carPrice,
    }
    prev.count += 1
    unitMap.set(key, prev)
  }
  const topUnits = [...unitMap.values()].sort((a, b) => b.count - a.count).slice(0, 6)

  const acceptanceRate =
    byStatus.accepted + byStatus.declined > 0
      ? Math.round((byStatus.accepted / (byStatus.accepted + byStatus.declined)) * 100)
      : 0

  return {
    total: apps.length,
    ...byStatus,
    estimatedMonthlyVolume,
    financedValue,
    acceptanceRate,
    topYards,
    topUnits,
  }
}

export function formatAnalyticsKES(value: number) {
  if (!value) return formatKES(0)
  return formatKES(Math.round(value))
}
