import { getPartnerBillingAccess } from './billingAccess'

/**
 * Accounts are free to create. When payments are on, posting a listing
 * requires an Active/Trial/Grace monthly subscription.
 */
export function dealerCanListInventory(accountId?: string | null) {
  const access = getPartnerBillingAccess(accountId, 'dealer')
  if (access.allowed) {
    return {
      allowed: true as const,
      reason:
        access.state === 'grace'
          ? ('grace' as const)
          : access.state === 'free'
            ? ('free' as const)
            : ('paid' as const),
      access,
    }
  }
  return {
    allowed: false as const,
    reason: access.state === 'frozen' ? ('frozen' as const) : ('payment_required' as const),
    message:
      access.message ||
      'Pay the monthly subscription (KES 2,000) to post a listing. Your account stays open either way.',
    access,
  }
}
