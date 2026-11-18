import { useEffect, useRef, useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import type { AuthSession } from '../data/auth'
import {
  SUBSCRIPTION_PRICE_KES,
  activateLenderSubscription,
  dealerSubscriptionIsPaid,
  formatBillingKES,
  getGraceDaysLeft,
  getLenderSubscriptionForAccount,
  lenderPlans,
  subscribeBilling,
} from '../data/billing'
import { getPartnerBillingAccess } from '../data/billingAccess'
import {
  getPlatformSettings,
  subscribePlatformSettings,
} from '../data/platformSettings'
import {
  confirmPaymentStatus,
  recordPaymentStarted,
} from '../data/paymentLedger'
import { getPaymentStatus, startSubscriptionStk } from '../lib/payheroApi'
import type { LoanPartner } from '../data/types'

type Ctx = { session: AuthSession; partner?: LoanPartner }
type PayState = 'idle' | 'sending' | 'waiting' | 'success' | 'failed'

export function LenderSubscription() {
  const { session } = useOutletContext<Ctx>()
  const plan = lenderPlans[0]
  const [paymentsRequired, setPaymentsRequired] = useState(
    () => getPlatformSettings().paymentsRequired,
  )
  const [sub, setSub] = useState(() => getLenderSubscriptionForAccount(session.accountId))
  const [access, setAccess] = useState(() => getPartnerBillingAccess(session.accountId, 'lender'))
  const [toast, setToast] = useState('')
  const [phone, setPhone] = useState('')
  const [payState, setPayState] = useState<PayState>('idle')
  const [payError, setPayError] = useState('')
  const [reference, setReference] = useState('')
  const [mpesaCode, setMpesaCode] = useState('')
  const pollRef = useRef<number | null>(null)

  useEffect(() => {
    const refresh = () => {
      setPaymentsRequired(getPlatformSettings().paymentsRequired)
      setSub(getLenderSubscriptionForAccount(session.accountId))
      setAccess(getPartnerBillingAccess(session.accountId, 'lender'))
    }
    refresh()
    const offPay = subscribePlatformSettings(refresh)
    const offBill = subscribeBilling(refresh)
    return () => {
      offPay()
      offBill()
    }
  }, [session.accountId])

  useEffect(() => {
    return () => {
      if (pollRef.current) window.clearInterval(pollRef.current)
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
    const row = activateLenderSubscription({
      accountId: session.accountId,
      lenderName: session.name,
      city: session.city,
    })
    setSub(row)
    setAccess(getPartnerBillingAccess(session.accountId, 'lender'))
    setPayState('success')
    setMpesaCode(mpesaReference || '')
    flash(
      mpesaReference
        ? `Payment confirmed (${mpesaReference}) — account restored`
        : 'Payment confirmed — account restored',
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
        partnerKind: 'lender',
      })
      recordPaymentStarted({
        reference: result.reference,
        externalReference: result.externalReference,
        accountId: session.accountId,
        partnerKind: 'lender',
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

  const pillClass =
    !paymentsRequired || paid
      ? 'ok'
      : access.state === 'grace'
        ? 'warn'
        : access.state === 'frozen'
          ? 'danger'
          : 'warn'

  const pillLabel = !paymentsRequired
    ? 'Free mode'
    : paid
      ? sub?.status ?? 'Active'
      : access.state === 'grace'
        ? `Grace · ${getGraceDaysLeft(sub!)}d left`
        : access.state === 'frozen'
          ? 'Frozen'
          : 'Payment due'

  return (
    <>
      {toast && <div className="admin-toast">{toast}</div>}

      <div className="admin-toolbar">
        <div>
          <h2>Subscription</h2>
          <p style={{ margin: '0.2rem 0 0', color: '#64748b', fontSize: '0.85rem' }}>
            {paymentsRequired
              ? `Pay ${formatBillingKES(SUBSCRIPTION_PRICE_KES)}/month via PayHero. Missed payments get a 3-day advance, then freeze.`
              : 'Payments are currently off — lender access is free'}
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
            <span className={`admin-pill ${pillClass}`}>{pillLabel}</span>
          </div>
          <div className="admin-grant-body">
            <strong style={{ fontSize: '1.35rem' }}>{plan.name}</strong>
            <p style={{ margin: 0, color: '#64748b' }}>
              {formatBillingKES(plan.monthlyPrice)} / month · Loan agent access
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
                  disabled={!phone.trim() || payState === 'sending' || payState === 'waiting'}
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
                Paid through {sub.nextBilling}
                {mpesaCode ? ` · M-Pesa ${mpesaCode}` : ''}
              </p>
            )}
          </div>
        </section>

        <section className="admin-panel admin-grant-card">
          <div className="admin-panel-head">
            <div>
              <h2>Missed payment rules</h2>
              <p>Same for dealers and lenders</p>
            </div>
          </div>
          <div className="admin-grant-body" style={{ gap: '0.65rem' }}>
            <p style={{ margin: 0, color: '#64748b', fontSize: '0.92rem' }}>
              If payment fails or renews late, Kenya Vehicles gives a <strong>3-day advance</strong>.
              Keep working during that window. If you still have not paid after 3 days, the account
              is <strong>frozen</strong> until M-Pesa payment clears.
            </p>
            <Link to="/lender/applications" className="admin-btn admin-btn-ghost">
              Go to applications
            </Link>
          </div>
        </section>
      </div>
    </>
  )
}
