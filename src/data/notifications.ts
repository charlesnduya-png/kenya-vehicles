import { adminAccounts, adminEnquiries } from './admin'
import { getEnquiriesForDealer, getEnquiriesForLoanPartner } from './enquiries'
import {
  getCustomerIdentity,
  getThreadsForCustomer,
  getThreadsForDealer,
} from './messages'
import { getOffersForDealer } from './offers'
import { getReports } from './reports'

export type BadgeCounts = Record<string, number>

function lastSenderIs(thread: { messages: { sender: string }[] }, sender: string) {
  const last = thread.messages[thread.messages.length - 1]
  return last?.sender === sender
}

/** Dealer portal nav badges */
export function getDealerBadges(dealerId: string): BadgeCounts {
  const enquiries = getEnquiriesForDealer(dealerId)
  const offers = getOffersForDealer(dealerId)
  const threads = getThreadsForDealer(dealerId)

  const newEnquiries = enquiries.filter((e) => e.status === 'New').length
  const acceptedLoans = enquiries.filter((e) => e.type === 'Loan' && e.status === 'Accepted').length
  const newOffers = offers.filter((o) => o.status === 'New').length
  const unreadMessages = threads.filter((t) => lastSenderIs(t, 'customer')).length

  return {
    '/dealer/enquiries': newEnquiries + acceptedLoans,
    '/dealer/offers': newOffers,
    '/dealer/messages': unreadMessages,
  }
}

export function getDealerNotificationTotal(dealerId: string) {
  const badges = getDealerBadges(dealerId)
  return Object.values(badges).reduce((sum, n) => sum + n, 0)
}

/** Loan agent portal nav badges */
export function getLenderBadges(loanPartnerId: string): BadgeCounts {
  const apps = getEnquiriesForLoanPartner(loanPartnerId)
  const newApps = apps.filter((e) => e.status === 'New').length
  return {
    '/lender/applications': newApps,
  }
}

export function getLenderNotificationTotal(loanPartnerId: string) {
  return getLenderBadges(loanPartnerId)['/lender/applications'] ?? 0
}

/** Admin console nav badges */
export function getAdminBadges(): BadgeCounts {
  const openEnquiries = adminEnquiries.filter((e) => e.status === 'New').length
  const pendingAccounts = adminAccounts.filter(
    (a) => a.status === 'Pending' || a.status === 'Suspended',
  ).length
  const newReports = getReports().filter(
    (r) => r.status === 'New' || r.status === 'Under review',
  ).length

  return {
    '/admin/enquiries': openEnquiries,
    '/admin/accounts': pendingAccounts,
    '/admin/reports': newReports,
  }
}

export function getAdminNotificationTotal() {
  return Object.values(getAdminBadges()).reduce((sum, n) => sum + n, 0)
}

/** Marketplace customer messages waiting for a reply */
export function getCustomerMessageBadges(phone?: string | null) {
  const identityPhone = phone ?? getCustomerIdentity()?.phone
  if (!identityPhone) return 0
  return getThreadsForCustomer(identityPhone).filter((t) => lastSenderIs(t, 'dealer')).length
}

export function formatBadgeCount(n: number) {
  if (n <= 0) return ''
  if (n > 99) return '99+'
  return String(n)
}
