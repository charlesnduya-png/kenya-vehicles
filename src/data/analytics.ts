import { adminEnquiries } from './admin'
import { cars, formatKES } from './cars'
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
      const stock = cars.filter((c) => c.dealerId === dealer.id)
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

export function formatAnalyticsKES(value: number) {
  if (!value) return formatKES(0)
  return formatKES(Math.round(value))
}
