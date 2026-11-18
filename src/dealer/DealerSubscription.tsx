import { useEffect, useRef, useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import type { AuthSession } from '../data/auth'
import {
  SUBSCRIPTION_PRICE_KES,
  activateDealerSubscription,
  dealerPlans,
  dealerSubscriptionIsPaid,
  formatBillingKES,
  getDealerSubscriptionForAccount,
  getGraceDaysLeft,
  subscribeBilling,
} from '../data/billing'
import { getPartnerBillingAccess } from '../data/billingAccess'
import {
  getPlatformSettings,
  subscribePlatformSettings,
} from '../data/platformSettings'
import {
  activateDealerBadge,
  getDealerBadgeForAccount,
  subscribeDealerBadges,
  verifiedBadgeProduct,
  VERIFIED_BADGE_DURATION_MONTHS,
} from '../data/dealerBadges'
import {
  confirmPaymentStatus,
  recordPaymentStarted,
} from '../data/paymentLedger'
import { getPaymentStatus, startSubscriptionStk } from '../lib/payheroApi'
import type { Dealer } from '../data/types'

type Ctx = { session: AuthSession; dealer?: Dealer }
type PayState = 'idle' | 'sending' | 'waiting' | 'success' | 'failed'

export function DealerSubscription() {
  const { session, dealer } = useOutletContext<Ctx>()
  const plan = dealerPlans[0]
  const [paymentsRequired, setPaymentsRequired] = useState(
    () => getPlatformSettings().paymentsRequired,
  )
  const [sub, setSub] = useState(() => getDealerSubscriptionForAccount(session.accountId))
  const [access, setAccess] = useState(() => getPartnerBillingAccess(session.accountId, 'dealer'))
  const [badge, setBadge] = useState(() => getDealerBadgeForAccount(session.accountId))
  const [toast, setToast] = useState('')
  const [phone, setPhone] = useState('')
  const [badgePhone, setBadgePhone] = useState('')
  const [payState, setPayState] = useState<PayState>('idle')
  const [badgePayState, setBadgePayState] = useState<PayState>('idle')
  const [payError, setPayError] = useState('')
  const [badgeError, setBadgeError] = useState('')
  const [reference, setReference] = useState('')
  const [badgeReference, setBadgeReference] = useState('')
  const [mpesaCode, setMpesaCode] = useState('')
  const pollRef = useRef<number | null>(null)
  const badgePollRef = useRef<number | null>(null)

  useEffect(() => {
    const refresh = () => {
      setPaymentsRequired(getPlatformSettings().paymentsRequired)
      setSub(getDealerSubscriptionForAccount(session.accountId))
      setAccess(getPartnerBillingAccess(session.accountId, 'dealer'))
      setBadge(getDealerBadgeForAccount(session.accountId))
    }
    refresh()
    const offPay = subscribePlatformSettings(refresh)
    const offBill = subscribeBilling(refresh)
    const offBadge = subscribeDealerBadges(refresh)
    return () => {
      offPay()
      offBill()
      offBadge()
    }
  }, [session.accountId])

  useEffect(() => {
    return () => {
      if (pollRef.current) window.clearInterval(pollRef.current)
      if (badgePollRef.current) window.clearInterval(badgePollRef.current)
    }
  }, [])

  const paid = sub ? dealerSubscriptionIsPaid(sub.status) : false
  const needsPayment = paymentsRequired && !paid

  function flash(message: string) {
    setToast(message)
    window.setTimeout(() => setToast(''), 3200)
  }

  function stopPolling() {
    if (pollRef.current) {
      window.clearInterval(pollRef.current)
      pollRef.current = null
    }
  }

  function unlockSubscription(mpesaReference?: string | null) {
    const row = activateDealerSubscription({
      accountId: session.accountId,
      dealerName: session.name,
      city: session.city,
    })
    setSub(row)
    setAccess(getPartnerBillingAccess(session.accountId, 'dealer'))
    setPayState('success')
    setMpesaCode(mpesaReference || '')
    flash(
      mpesaReference
        ? `Payment confirmed (${mpesaReference}) — unlimited listings unlocked`
        : 'Payment confirmed — unlimited listings unlocked',
    )
  }

  function startPolling(ref: string) {
    stopPolling()
    let ticks = 0
    pollRef.current = window.setInterval(async () => {
      ticks += 1
      try {
        const status = await getPaymentStatus(ref)
        if (status.paid) {
          confirmPaymentStatus({
            reference: ref,
            status: 'SUCCESS',
            mpesaReference: status.mpesaReference,
          })
          stopPolling()
          unlockSubscription(status.mpesaReference)
          return
        }
        if (status.failed) {
          confirmPaymentStatus({
            reference: ref,
            status: 'FAILED',
            mpesaReference: status.mpesaReference,
            note: 'System confirmed monthly M-Pesa payment failed or was cancelled',
          })
          stopPolling()
          setPayState('failed')
          setPayError(
            'Payment failed. Admin can see this and open your monthly account manually if needed.',
          )
          return
        }
      } catch (err) {
        if (ticks > 2) {
          setPayError(err instanceof Error ? err.message : 'Could not check payment status.')
        }
      }
      if (ticks >= 40) {
        stopPolling()
        setPayState('failed')
        setPayError('No confirmation yet. If you paid, wait a moment and check status again.')
      }
    }, 3000)
  }

  async function payWithMpesa() {
    setPayError('')
    setMpesaCode('')
    setPayState('sending')
    try {
      const result = await startSubscriptionStk({
        phone,
        accountId: session.accountId,
        dealerName: session.name,
        city: session.city,
        amount: SUBSCRIPTION_PRICE_KES,
        partnerKind: 'dealer',
      })
      recordPaymentStarted({
        reference: result.reference,
        externalReference: result.externalReference,
        accountId: session.accountId,
        partnerKind: 'dealer',
        partnerName: session.name,
        city: session.city,
        phone: result.phone,
        amount: result.amount,
      })
      setReference(result.reference)
      setPayState('waiting')
      flash(result.message)
      startPolling(result.reference)
    } catch (err) {
      setPayState('failed')
      setPayError(err instanceof Error ? err.message : 'Could not start M-Pesa payment.')
    }
  }

  async function checkAgain() {
    if (!reference) return
    setPayError('')
    try {
      const status = await getPaymentStatus(reference)
      if (status.paid) {
        confirmPaymentStatus({
          reference,
          status: 'SUCCESS',
          mpesaReference: status.mpesaReference,
        })
        stopPolling()
        unlockSubscription(status.mpesaReference)
        return
      }
      if (status.failed) {
        confirmPaymentStatus({
          reference,
          status: 'FAILED',
          mpesaReference: status.mpesaReference,
          note: 'System confirmed monthly M-Pesa payment failed or was cancelled',
        })
        setPayState('failed')
        setPayError(
          'Payment failed. Admin can see this and open your monthly account manually if needed.',
        )
        return
      }
      setPayState('waiting')
      flash('Still waiting for M-Pesa confirmation…')
      startPolling(reference)
    } catch (err) {
      setPayError(err instanceof Error ? err.message : 'Could not check payment status.')
    }
  }

  return (
    <>
      {toast && <div className="admin-toast">{toast}</div>}

      <div className="admin-toolbar">
        <div>
          <h2>Subscription</h2>
          <p style={{ margin: '0.2rem 0 0', color: '#64748b', fontSize: '0.85rem' }}>
            {paymentsRequired
              ? `Your account is free. Pay ${formatBillingKES(SUBSCRIPTION_PRICE_KES)}/month only to post listings. Missed renewals get a 3-day advance, then listing freezes.`
              : 'Payments are currently off — listing is free for all dealers'}
          </p>
        </div>
        <Link to="/pricing" className="admin-btn admin-btn-ghost">
          View pricing
        </Link>
      </div>

      <div className="admin-grant-grid">
        <section className="admin-panel admin-grant-card">
          <div className="admin-panel-head">
            <div>
              <h2>Current plan</h2>
              <p>Active for {session.name}</p>
            </div>
            <span
              className={`admin-pill ${
                !paymentsRequired || paid
                  ? 'ok'
                  : access.state === 'grace'
                    ? 'warn'
                    : access.state === 'frozen'
                      ? 'danger'
                      : 'warn'
              }`}
            >
              {!paymentsRequired
                ? 'Free mode'
                : paid
                  ? sub?.status ?? 'Active'
                  : access.state === 'grace' && sub
                    ? `Grace · ${getGraceDaysLeft(sub)}d left`
                    : access.state === 'frozen'
                      ? 'Frozen'
                      : 'Payment due'}
            </span>
          </div>
          <div className="admin-grant-body">
            <strong style={{ fontSize: '1.35rem' }}>{plan.name}</strong>
            <p style={{ margin: 0, color: '#64748b' }}>
              {formatBillingKES(plan.monthlyPrice)} / month · Unlimited listings
            </p>
            <ul style={{ margin: '0.5rem 0 0', paddingLeft: '1.1rem', color: '#374151' }}>
              {plan.perks.map((f) => (
                <li key={f} style={{ marginBottom: '0.25rem' }}>
                  {f}
                </li>
              ))}
            </ul>

            {needsPayment && (
              <div style={{ marginTop: '1rem', display: 'grid', gap: '0.65rem' }}>
                <label style={{ display: 'grid', gap: '0.35rem', fontSize: '0.85rem', fontWeight: 600 }}>
                  M-Pesa phone number
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="07XXXXXXXX"
                    inputMode="tel"
                    disabled={payState === 'sending' || payState === 'waiting'}
                    style={{
                      border: '1px solid var(--admin-line)',
                      borderRadius: 10,
                      padding: '0.65rem 0.75rem',
                      font: 'inherit',
                    }}
                  />
                </label>
                <button
                  type="button"
                  className="admin-btn admin-btn-primary"
                  onClick={payWithMpesa}
                  disabled={
                    !phone.trim() || payState === 'sending' || payState === 'waiting'
                  }
                >
                  {payState === 'sending'
                    ? 'Sending M-Pesa prompt…'
                    : payState === 'waiting'
                      ? 'Waiting for PIN…'
                      : `Pay ${formatBillingKES(SUBSCRIPTION_PRICE_KES)}/month with M-Pesa`}
                </button>
                {payState === 'waiting' && (
                  <p style={{ margin: 0, color: '#0e7490', fontSize: '0.9rem' }}>
                    Check your phone for the M-Pesa prompt, enter your PIN, then wait for
                    confirmation.
                    {reference ? ` Ref: ${reference}` : ''}
                  </p>
                )}
                {(payState === 'waiting' || payState === 'failed') && reference && (
                  <button type="button" className="admin-btn admin-btn-ghost" onClick={checkAgain}>
                    Check payment status
                  </button>
                )}
                {payError && (
                  <p style={{ margin: 0, color: '#b42318', fontSize: '0.9rem' }}>{payError}</p>
                )}
              </div>
            )}

            {paymentsRequired && paid && sub && (
              <p style={{ margin: '0.85rem 0 0', color: '#067647', fontWeight: 600 }}>
                Paid through {sub.nextBilling} · unlimited cars unlocked
                {mpesaCode ? ` · M-Pesa ${mpesaCode}` : ''}
              </p>
            )}
          </div>
        </section>

        <section className="admin-panel admin-grant-card">
          <div className="admin-panel-head">
            <div>
              <h2>Verified badge</h2>
              <p>
                Optional · renews every {VERIFIED_BADGE_DURATION_MONTHS} months ·{' '}
                {formatBillingKES(verifiedBadgeProduct.price)}
              </p>
            </div>
            <span
              className={`admin-pill ${
                badge?.status === 'Active' ? 'ok' : badge?.status === 'Expired' ? 'warn' : 'muted'
              }`}
            >
              {badge?.status === 'Active'
                ? `Verified · renews ${badge.renews}`
                : badge?.status === 'Expired'
                  ? 'Expired — renew'
                  : 'Not verified'}
            </span>
          </div>
          <div className="admin-grant-body" style={{ gap: '0.65rem' }}>
            <ul style={{ margin: 0, paddingLeft: '1.1rem', color: '#374151' }}>
              {verifiedBadgeProduct.perks.map((perk) => (
                <li key={perk} style={{ marginBottom: '0.25rem' }}>
                  {perk}
                </li>
              ))}
            </ul>
            <label style={{ display: 'grid', gap: '0.35rem', fontSize: '0.85rem', fontWeight: 600 }}>
              M-Pesa phone for badge
              <input
                value={badgePhone}
                onChange={(e) => setBadgePhone(e.target.value)}
                placeholder="07XXXXXXXX"
                inputMode="tel"
                disabled={badgePayState === 'sending' || badgePayState === 'waiting'}
                style={{
                  border: '1px solid var(--admin-line)',
                  borderRadius: 10,
                  padding: '0.65rem 0.75rem',
                  font: 'inherit',
                }}
              />
            </label>
            <button
              type="button"
              className="admin-btn admin-btn-primary"
              disabled={
                !badgePhone.trim() ||
                !session.dealerId ||
                badgePayState === 'sending' ||
                badgePayState === 'waiting'
              }
              onClick={async () => {
                if (!session.dealerId) return
                setBadgeError('')
                setBadgePayState('sending')
                try {
                  const result = await startSubscriptionStk({
                    phone: badgePhone,
                    accountId: session.accountId,
                    dealerName: session.name,
                    city: session.city,
                    amount: verifiedBadgeProduct.price,
                    partnerKind: 'dealer',
                  })
                  recordPaymentStarted({
                    reference: result.reference,
                    externalReference: result.externalReference,
                    accountId: session.accountId,
                    partnerKind: 'dealer',
                    partnerName: `${session.name} (Verified Badge)`,
                    city: session.city,
                    phone: result.phone,
                    amount: result.amount,
                  })
                  setBadgeReference(result.reference)
                  setBadgePayState('waiting')
                  flash(result.message)
                  if (badgePollRef.current) window.clearInterval(badgePollRef.current)
                  let ticks = 0
                  badgePollRef.current = window.setInterval(async () => {
                    ticks += 1
                    try {
                      const status = await getPaymentStatus(result.reference)
                      if (status.paid) {
                        confirmPaymentStatus({
                          reference: result.reference,
                          status: 'SUCCESS',
                          mpesaReference: status.mpesaReference,
                          note: 'System confirmed verified badge payment',
                        })
                        if (badgePollRef.current) window.clearInterval(badgePollRef.current)
                        const row = activateDealerBadge({
                          accountId: session.accountId,
                          dealerId: session.dealerId!,
                          dealerName: session.name,
                          city: session.city,
                          mpesaReference: status.mpesaReference || undefined,
                        })
                        setBadge(row)
                        setBadgePayState('success')
                        flash(
                          `Verified badge active until ${row.renews} (renews every ${VERIFIED_BADGE_DURATION_MONTHS} months)`,
                        )
                        return
                      }
                      if (status.failed) {
                        confirmPaymentStatus({
                          reference: result.reference,
                          status: 'FAILED',
                          note: 'System confirmed verified badge payment failed',
                        })
                        if (badgePollRef.current) window.clearInterval(badgePollRef.current)
                        setBadgePayState('failed')
                        setBadgeError('Badge payment failed. Try again or ask admin to grant it.')
                      }
                    } catch {
                      /* keep polling */
                    }
                    if (ticks >= 40) {
                      if (badgePollRef.current) window.clearInterval(badgePollRef.current)
                      setBadgePayState('failed')
                      setBadgeError('No confirmation yet. Check status or retry.')
                    }
                  }, 3000)
                } catch (err) {
                  setBadgePayState('failed')
                  setBadgeError(err instanceof Error ? err.message : 'Could not start badge payment.')
                }
              }}
            >
              {badgePayState === 'sending'
                ? 'Sending M-Pesa prompt…'
                : badgePayState === 'waiting'
                  ? 'Waiting for PIN…'
                  : badge?.status === 'Active'
                    ? `Renew badge · ${formatBillingKES(verifiedBadgeProduct.price)} / ${VERIFIED_BADGE_DURATION_MONTHS} mo`
                    : `Buy verified badge · ${formatBillingKES(verifiedBadgeProduct.price)} / ${VERIFIED_BADGE_DURATION_MONTHS} mo`}
            </button>
            {badgePayState === 'waiting' && badgeReference && (
              <p style={{ margin: 0, color: '#0e7490', fontSize: '0.9rem' }}>
                Enter your M-Pesa PIN. Ref: {badgeReference}
              </p>
            )}
            {badgeError && (
              <p style={{ margin: 0, color: '#b42318', fontSize: '0.9rem' }}>{badgeError}</p>
            )}
            {dealer?.verified && badge?.status === 'Active' && (
              <p style={{ margin: 0, color: '#067647', fontWeight: 600 }}>
                Your yard shows as Verified until {badge.renews}
              </p>
            )}
            <Link to="/dealer/profile" className="admin-btn admin-btn-ghost">
              View yard profile
            </Link>
          </div>
        </section>
      </div>
    </>
  )
}
