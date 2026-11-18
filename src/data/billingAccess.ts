import {
  PAYMENT_GRACE_DAYS,
  enforceBillingStates,
  formatBillingKES,
  getDealerSubscriptionForAccount,
  getGraceDaysLeft,
  getLenderSubscriptionForAccount,
  subscriptionAllowsAccess,
  type BillingStatus,
  type DealerSubscription,
  type LenderSubscription,
} from './billing'
import { isPaymentsRequired } from './platformSettings'

export type PartnerKind = 'dealer' | 'lender'

export type BillingAccess = {
  state: 'free' | 'paid' | 'grace' | 'frozen' | 'unpaid'
  /** Can post listings / use paid features */
  allowed: boolean
  /** Can use the portal (profile, inbox, etc.) without paying */
  canUsePortal: boolean
  daysLeft: number
  message: string
  status: BillingStatus | null
  graceUntil: string | null
  subscription: DealerSubscription | LenderSubscription | null
}

function emptyAccess(
  partial: Partial<BillingAccess> & Pick<BillingAccess, 'state' | 'allowed' | 'message'>,
): BillingAccess {
  return {
    canUsePortal: true,
    daysLeft: 0,
    status: null,
    graceUntil: null,
    subscription: null,
    ...partial,
  }
}

export function getPartnerBillingAccess(
  accountId: string | null | undefined,
  kind: PartnerKind,
): BillingAccess {
  if (!isPaymentsRequired()) {
    return emptyAccess({
      state: 'free',
      allowed: true,
      message: 'Payments are off — full access is free.',
    })
  }

  if (!accountId) {
    return emptyAccess({
      state: 'unpaid',
      allowed: false,
      canUsePortal: false,
      message: 'Sign in to manage your account.',
    })
  }

  enforceBillingStates()
  const subscription =
    kind === 'dealer'
      ? getDealerSubscriptionForAccount(accountId)
      : getLenderSubscriptionForAccount(accountId)

  // New / unpaid accounts: free to exist in the portal; pay only to post listings (dealers)
  if (!subscription) {
    return emptyAccess({
      state: 'unpaid',
      allowed: kind === 'lender',
      canUsePortal: true,
      message:
        kind === 'dealer'
          ? `Your account is free. Pay ${formatBillingKES(2000)}/month only when you post a car or hire listing.`
          : `Your lender account is active. Monthly plan is ${formatBillingKES(2000)} if billing is enabled for partners.`,
    })
  }

  if (subscription.status === 'Frozen') {
    return {
      state: 'frozen',
      allowed: false,
      canUsePortal: true,
      daysLeft: 0,
      status: 'Frozen',
      graceUntil: subscription.graceUntil ?? null,
      subscription,
      message:
        kind === 'dealer'
          ? 'Listing is frozen after the 3-day advance. Pay the monthly subscription to post again.'
          : 'Account listing rights frozen after the 3-day advance. Pay to restore full access.',
    }
  }

  if (subscription.status === 'Grace') {
    const daysLeft = getGraceDaysLeft(subscription)
    return {
      state: 'grace',
      allowed: true,
      canUsePortal: true,
      daysLeft,
      status: 'Grace',
      graceUntil: subscription.graceUntil ?? null,
      subscription,
      message:
        daysLeft > 0
          ? `Payment missed — ${daysLeft} day${daysLeft === 1 ? '' : 's'} of advance left. Pay before ${subscription.graceUntil} or listing freezes.`
          : `Payment advance ends today (${subscription.graceUntil}). Pay now to keep posting.`,
    }
  }

  if (subscriptionAllowsAccess(subscription.status)) {
    return {
      state: 'paid',
      allowed: true,
      canUsePortal: true,
      daysLeft: 0,
      status: subscription.status,
      graceUntil: null,
      subscription,
      message: `Monthly subscription ${subscription.status.toLowerCase()} through ${subscription.nextBilling}.`,
    }
  }

  return {
    state: 'unpaid',
    allowed: false,
    canUsePortal: true,
    daysLeft: 0,
    status: subscription.status,
    graceUntil: subscription.graceUntil ?? null,
    subscription,
    message:
      kind === 'dealer'
        ? `Pay ${formatBillingKES(subscription.amount)}/month to post listings. Missed payments get a ${PAYMENT_GRACE_DAYS}-day advance, then listing freezes.`
        : `Pay ${formatBillingKES(subscription.amount)}/month to restore partner billing. Missed payments get a ${PAYMENT_GRACE_DAYS}-day advance, then freeze.`,
  }
}
