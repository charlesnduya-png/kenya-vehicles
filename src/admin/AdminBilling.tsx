import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { adminAccounts } from '../data/admin'
import {
  PAYMENT_GRACE_DAYS,
  SUBSCRIPTION_PRICE_KES,
  activateDealerSubscription,
  activateLenderSubscription,
  enforceBillingStates,
  formatBillingKES,
  getDealerSubscriptions,
  getGraceDaysLeft,
  getLenderSubscriptions,
  setDealerSubscriptionStatus,
  setLenderSubscriptionStatus,
  subscribeBilling,
  type DealerSubscription,
  type LenderSubscription,
} from '../data/billing'
import {
  VERIFIED_BADGE_DURATION_MONTHS,
  activateDealerBadge,
  getDealerBadges,
  revokeDealerBadge,
  subscribeDealerBadges,
  verifiedBadgeProduct,
  type DealerBadgeOrder,
} from '../data/dealerBadges'
import { dealers } from '../data/dealers'
import {
  getFailedPayments,
  getPaymentRecords,
  recordAdminManualOpen,
  subscribePaymentLedger,
  type PaymentRecord,
} from '../data/paymentLedger'
import {
  getPlatformSettings,
  setPaymentsRequired,
  subscribePlatformSettings,
} from '../data/platformSettings'

export function AdminBilling() {
  const dealerAccounts = useMemo(() => adminAccounts.filter((a) => a.role === 'Dealer'), [])

  const [tab, setTab] = useState<'payments' | 'dealers' | 'lenders' | 'badges'>('payments')
  const [q, setQ] = useState('')
  const [toast, setToast] = useState('')
  const [paymentsRequired, setPaymentsOn] = useState(
    () => getPlatformSettings().paymentsRequired,
  )
  const [dealerSubs, setDealerSubs] = useState<DealerSubscription[]>(() => getDealerSubscriptions())
  const [lenderSubs, setLenderSubs] = useState<LenderSubscription[]>(() => getLenderSubscriptions())
  const [payments, setPayments] = useState<PaymentRecord[]>(() => getPaymentRecords())
  const [badges, setBadges] = useState<DealerBadgeOrder[]>(() => getDealerBadges())
  const [badgeAccountId, setBadgeAccountId] = useState(dealerAccounts[0]?.id ?? '')
  const [subAccountId, setSubAccountId] = useState(dealerAccounts[0]?.id ?? '')

  useEffect(() => {
    const refresh = () => {
      enforceBillingStates()
      setPaymentsOn(getPlatformSettings().paymentsRequired)
      setDealerSubs(getDealerSubscriptions())
      setLenderSubs(getLenderSubscriptions())
      setPayments(getPaymentRecords())
      setBadges(getDealerBadges())
    }
    refresh()
    const offSettings = subscribePlatformSettings(refresh)
    const offBilling = subscribeBilling(refresh)
    const offPay = subscribePaymentLedger(refresh)
    const offBadge = subscribeDealerBadges(refresh)
    return () => {
      offSettings()
      offBilling()
      offPay()
      offBadge()
    }
  }, [])

  const mrr =
    dealerSubs
      .filter((s) => s.status === 'Active' || s.status === 'Grace' || s.status === 'Past due')
      .reduce((sum, s) => sum + s.amount, 0) +
    lenderSubs
      .filter((s) => s.status === 'Active' || s.status === 'Grace' || s.status === 'Past due')
      .reduce((sum, s) => sum + s.amount, 0) +
    badges.filter((b) => b.status === 'Active').reduce((sum, b) => sum + b.amount, 0)

  const dealerRows = useMemo(() => {
    return dealerSubs.filter((s) => {
      const hay = `${s.dealerName} ${s.planName} ${s.city}`.toLowerCase()
      return !q || hay.includes(q.toLowerCase())
    })
  }, [q, dealerSubs])

  const lenderRows = useMemo(() => {
    return lenderSubs.filter((s) => {
      const hay = `${s.lenderName} ${s.planName} ${s.city}`.toLowerCase()
      return !q || hay.includes(q.toLowerCase())
    })
  }, [q, lenderSubs])

  const badgeRows = useMemo(() => {
    return badges.filter((b) => {
      const hay = `${b.dealerName} ${b.city} ${b.status}`.toLowerCase()
      return !q || hay.includes(q.toLowerCase())
    })
  }, [q, badges])

  const paymentRows = useMemo(() => {
    return payments.filter((p) => {
      const hay =
        `${p.partnerName} ${p.accountId} ${p.phone} ${p.reference} ${p.status} ${p.partnerKind}`.toLowerCase()
      return !q || hay.includes(q.toLowerCase())
    })
  }, [q, payments])

  const failedCount = useMemo(() => getFailedPayments().length, [payments])

  function flash(message: string) {
    setToast(message)
    window.setTimeout(() => setToast(''), 2800)
  }

  function togglePayments() {
    const next = !paymentsRequired
    setPaymentsRequired(next)
    setPaymentsOn(next)
    flash(
      next
        ? `Payments ON — KES 2,000/month to post. Missed pay → ${PAYMENT_GRACE_DAYS}-day advance, then freeze.`
        : 'Payments OFF — site is free; dealers and lenders can access without paying.',
    )
  }

  function subClass(status: string) {
    if (status === 'Active') return 'ok'
    if (status === 'Trial') return 'info'
    if (status === 'Grace' || status === 'Past due') return 'warn'
    if (status === 'Frozen') return 'danger'
    return 'danger'
  }

  function badgeClass(status: string) {
    if (status === 'Active') return 'ok'
    if (status === 'Pending payment') return 'warn'
    return 'muted'
  }

  function paymentClass(status: string) {
    if (status === 'SUCCESS') return 'ok'
    if (status === 'QUEUED') return 'info'
    return 'danger'
  }

  function grantDealerSubscription(e: FormEvent) {
    e.preventDefault()
    const account = dealerAccounts.find((a) => a.id === subAccountId)
    if (!account) return
    activateDealerSubscription({
      accountId: account.id,
      dealerName: account.name,
      city: account.city,
    })
    recordAdminManualOpen({
      accountId: account.id,
      partnerKind: 'dealer',
      partnerName: account.name,
      city: account.city,
      note: 'Admin granted monthly listing subscription manually',
    })
    setDealerSubs(getDealerSubscriptions())
    setPayments(getPaymentRecords())
    flash(
      `Monthly subscription opened for ${account.name} (${formatBillingKES(SUBSCRIPTION_PRICE_KES)}/mo)`,
    )
  }

  function grantVerifiedBadge(e: FormEvent) {
    e.preventDefault()
    const account = dealerAccounts.find((a) => a.id === badgeAccountId)
    if (!account) return
    const dealer =
      dealers.find((d) => d.email.toLowerCase() === account.email.toLowerCase()) ||
      dealers.find((d) => d.name.toLowerCase() === account.name.toLowerCase())
    if (!dealer) {
      flash('No yard profile linked to that dealer account')
      return
    }
    const row = activateDealerBadge({
      accountId: account.id,
      dealerId: dealer.id,
      dealerName: account.name,
      city: account.city,
      grantedByAdmin: true,
    })
    setBadges(getDealerBadges())
    flash(
      `Verified badge granted to ${account.name} until ${row.renews} (${VERIFIED_BADGE_DURATION_MONTHS} months)`,
    )
  }

  function markDealerPastDue(accountId: string) {
    setDealerSubscriptionStatus(accountId, 'Past due')
    flash(`Dealer entered ${PAYMENT_GRACE_DAYS}-day advance (then freeze)`)
  }

  function markLenderPastDue(accountId: string) {
    setLenderSubscriptionStatus(accountId, 'Past due')
    flash(`Lender entered ${PAYMENT_GRACE_DAYS}-day advance (then freeze)`)
  }

  function openAccountManually(payment: PaymentRecord) {
    if (payment.partnerKind === 'dealer') {
      activateDealerSubscription({
        accountId: payment.accountId,
        dealerName: payment.partnerName,
        city: payment.city || 'Nairobi',
      })
    } else {
      activateLenderSubscription({
        accountId: payment.accountId,
        lenderName: payment.partnerName,
        city: payment.city || 'Nairobi',
      })
    }
    recordAdminManualOpen({
      accountId: payment.accountId,
      partnerKind: payment.partnerKind,
      partnerName: payment.partnerName,
      city: payment.city,
      relatedReference: payment.reference,
      note: `Admin opened monthly access after system-confirmed ${payment.status.toLowerCase()} payment`,
    })
    flash(`Opened monthly access for ${payment.partnerName}`)
  }

  function openPartnerManually(
    kind: 'dealer' | 'lender',
    accountId: string,
    name: string,
    city: string,
  ) {
    if (kind === 'dealer') {
      activateDealerSubscription({ accountId, dealerName: name, city })
    } else {
      activateLenderSubscription({ accountId, lenderName: name, city })
    }
    recordAdminManualOpen({
      accountId,
      partnerKind: kind,
      partnerName: name,
      city,
      note: 'Admin opened monthly subscription manually',
    })
    flash(`Opened monthly access for ${name}`)
  }

  return (
    <>
      {toast && <div className="admin-toast">{toast}</div>}

      <section className="admin-panel" style={{ marginBottom: '1rem' }}>
        <div className="admin-panel-head">
          <div>
            <h2>Payment switch</h2>
            <p>
              Off = free listing. On = accounts stay free to create; dealers pay{' '}
              {formatBillingKES(SUBSCRIPTION_PRICE_KES)}/month only to post listings. Missed
              renewal → {PAYMENT_GRACE_DAYS}-day advance, then listing freeze.
            </p>
          </div>
          <button
            type="button"
            className={`admin-switch ${paymentsRequired ? 'is-on' : ''}`}
            role="switch"
            aria-checked={paymentsRequired}
            onClick={togglePayments}
          >
            <span className="admin-switch-track">
              <span className="admin-switch-knob" />
            </span>
            <span className="admin-switch-label">
              {paymentsRequired ? 'Payments required' : 'Free access'}
            </span>
          </button>
        </div>
        <div className="admin-grant-body" style={{ paddingTop: 0 }}>
          <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>
            {paymentsRequired
              ? `New accounts are free. Payment is required to post listings. After a missed renewal, ${PAYMENT_GRACE_DAYS}-day advance applies, then listing freezes until paid (or admin opens monthly access).`
              : 'All dealers and lenders can post freely until you turn this switch on.'}
          </p>
        </div>
      </section>

      <div className="admin-grid-kpi">
        <article className="admin-kpi">
          <span>Est. monthly revenue</span>
          <strong style={{ fontSize: '1.25rem' }}>{formatBillingKES(mrr)}</strong>
          <em>Dealers + lenders + badges</em>
        </article>
        <article className="admin-kpi">
          <span>Monthly plan</span>
          <strong style={{ fontSize: '1.25rem' }}>
            {formatBillingKES(SUBSCRIPTION_PRICE_KES)}
          </strong>
          <em>Billed every month</em>
        </article>
        <article className="admin-kpi">
          <span>Failed payments</span>
          <strong>{failedCount}</strong>
          <em>System-confirmed · open manually</em>
        </article>
        <article className="admin-kpi">
          <span>Payment mode</span>
          <strong style={{ fontSize: '1.1rem' }}>{paymentsRequired ? 'On' : 'Off'}</strong>
          <em>{paymentsRequired ? 'Monthly paid access' : 'Free access'}</em>
        </article>
      </div>

      <div className="admin-grant-grid">
        <form className="admin-panel admin-grant-card" onSubmit={grantDealerSubscription}>
          <div className="admin-panel-head">
            <div>
              <h2>Manually grant dealer subscription</h2>
              <p>
                Open monthly listing access ({formatBillingKES(SUBSCRIPTION_PRICE_KES)}/mo) without
                M-Pesa — for failed payments or free unlocks
              </p>
            </div>
          </div>
          <div className="admin-grant-body">
            <div className="admin-grant-fields">
              <label>
                Dealer account
                <select
                  value={subAccountId}
                  onChange={(e) => setSubAccountId(e.target.value)}
                  required
                >
                  {dealerAccounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} · {a.city}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <button type="submit" className="admin-btn admin-btn-primary">
              Grant monthly subscription
            </button>
          </div>
        </form>

        <form className="admin-panel admin-grant-card" onSubmit={grantVerifiedBadge}>
          <div className="admin-panel-head">
            <div>
              <h2>Manually grant verified badge</h2>
              <p>
                Issue or renew a dealer Verified Badge ({formatBillingKES(verifiedBadgeProduct.price)}{' '}
                / {VERIFIED_BADGE_DURATION_MONTHS} months)
              </p>
            </div>
          </div>
          <div className="admin-grant-body">
            <div className="admin-grant-fields">
              <label>
                Dealer account
                <select
                  value={badgeAccountId}
                  onChange={(e) => setBadgeAccountId(e.target.value)}
                  required
                >
                  {dealerAccounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} · {a.city}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <button type="submit" className="admin-btn admin-btn-primary">
              Grant / renew verified badge
            </button>
          </div>
        </form>
      </div>

      <div className="admin-toolbar">
        <div>
          <h2>Billing &amp; monetization</h2>
          <p style={{ margin: '0.2rem 0 0', color: '#64748b', fontSize: '0.85rem' }}>
            Monthly {formatBillingKES(SUBSCRIPTION_PRICE_KES)} · failed payments show here for admin
            open
          </p>
        </div>
        <div className="admin-toolbar-actions">
          <button
            type="button"
            className={`admin-btn ${tab === 'payments' ? 'admin-btn-primary' : 'admin-btn-ghost'}`}
            onClick={() => setTab('payments')}
          >
            Payments{failedCount > 0 ? ` (${failedCount})` : ''}
          </button>
          <button
            type="button"
            className={`admin-btn ${tab === 'dealers' ? 'admin-btn-primary' : 'admin-btn-ghost'}`}
            onClick={() => setTab('dealers')}
          >
            Dealers
          </button>
          <button
            type="button"
            className={`admin-btn ${tab === 'lenders' ? 'admin-btn-primary' : 'admin-btn-ghost'}`}
            onClick={() => setTab('lenders')}
          >
            Lenders
          </button>
          <button
            type="button"
            className={`admin-btn ${tab === 'badges' ? 'admin-btn-primary' : 'admin-btn-ghost'}`}
            onClick={() => setTab('badges')}
          >
            Verified badges
          </button>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…" />
        </div>
      </div>

      {tab === 'payments' && (
        <section className="admin-panel">
          <div className="admin-panel-head">
            <div>
              <h2>Monthly payment attempts</h2>
              <p>
                System confirms success or failure from PayHero. If payment failed, open the account
                manually for one month.
              </p>
            </div>
          </div>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Partner</th>
                  <th>Period</th>
                  <th>Amount</th>
                  <th>Phone</th>
                  <th>Status</th>
                  <th>Confirmed</th>
                  <th>Updated</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {paymentRows.length === 0 && (
                  <tr>
                    <td colSpan={8} style={{ color: '#64748b' }}>
                      No M-Pesa subscription payments yet. Attempts appear here when dealers or
                      lenders pay.
                    </td>
                  </tr>
                )}
                {paymentRows.map((pay) => (
                  <tr key={pay.id}>
                    <td>
                      <strong>{pay.partnerName}</strong>
                      <div style={{ color: '#64748b', fontSize: '0.8rem' }}>
                        {pay.partnerKind} · {pay.reference}
                      </div>
                    </td>
                    <td>
                      <span className="admin-pill muted">Monthly</span>
                    </td>
                    <td className="mono">{formatBillingKES(pay.amount)}</td>
                    <td>{pay.phone}</td>
                    <td>
                      <span className={`admin-pill ${paymentClass(pay.status)}`}>{pay.status}</span>
                      {pay.note && (
                        <div style={{ color: '#64748b', fontSize: '0.78rem', marginTop: 4 }}>
                          {pay.note}
                        </div>
                      )}
                    </td>
                    <td>
                      <span className={`admin-pill ${pay.confirmedBy === 'admin' ? 'info' : 'muted'}`}>
                        {pay.confirmedBy === 'admin' ? 'Admin' : 'System'}
                      </span>
                      {pay.mpesaReference ? (
                        <div style={{ color: '#64748b', fontSize: '0.78rem', marginTop: 4 }}>
                          {pay.mpesaReference}
                        </div>
                      ) : null}
                    </td>
                    <td>{new Date(pay.updatedAt).toLocaleString()}</td>
                    <td>
                      <div className="admin-row-actions">
                        {(pay.status === 'FAILED' || pay.status === 'QUEUED') &&
                          pay.confirmedBy !== 'admin' && (
                            <button type="button" onClick={() => openAccountManually(pay)}>
                              Open monthly access
                            </button>
                          )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {tab === 'dealers' && (
        <section className="admin-panel">
          <div className="admin-panel-head">
            <div>
              <h2>Dealer subscriptions</h2>
              <p>
                {formatBillingKES(SUBSCRIPTION_PRICE_KES)}/mo · {PAYMENT_GRACE_DAYS}-day advance then
                freeze
              </p>
            </div>
          </div>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Dealer</th>
                  <th>Plan</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Grace / freeze</th>
                  <th>Next billing</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {dealerRows.map((sub) => (
                  <tr key={sub.id}>
                    <td>
                      <strong>{sub.dealerName}</strong>
                      <div style={{ color: '#64748b', fontSize: '0.8rem' }}>{sub.city}</div>
                    </td>
                    <td>
                      <span className="admin-pill muted">{sub.planName}</span>
                    </td>
                    <td className="mono">{formatBillingKES(sub.amount)}/mo</td>
                    <td>
                      <span className={`admin-pill ${subClass(sub.status)}`}>
                        {sub.status}
                        {sub.status === 'Grace' ? ` · ${getGraceDaysLeft(sub)}d` : ''}
                      </span>
                    </td>
                    <td>
                      {sub.status === 'Grace'
                        ? `Until ${sub.graceUntil}`
                        : sub.status === 'Frozen'
                          ? `Frozen ${sub.frozenAt ?? ''}`
                          : '—'}
                    </td>
                    <td>{sub.nextBilling}</td>
                    <td>
                      <div className="admin-row-actions">
                        {sub.status !== 'Active' && (
                          <button
                            type="button"
                            onClick={() =>
                              openPartnerManually(
                                'dealer',
                                sub.accountId,
                                sub.dealerName,
                                sub.city,
                              )
                            }
                          >
                            Open monthly
                          </button>
                        )}
                        {(sub.status === 'Active' || sub.status === 'Trial') && (
                          <button type="button" onClick={() => markDealerPastDue(sub.accountId)}>
                            Start grace
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {tab === 'lenders' && (
        <section className="admin-panel">
          <div className="admin-panel-head">
            <div>
              <h2>Lender subscriptions</h2>
              <p>
                {formatBillingKES(SUBSCRIPTION_PRICE_KES)}/mo · {PAYMENT_GRACE_DAYS}-day advance then
                freeze
              </p>
            </div>
          </div>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Lender</th>
                  <th>Plan</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Grace / freeze</th>
                  <th>Next billing</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {lenderRows.map((sub) => (
                  <tr key={sub.id}>
                    <td>
                      <strong>{sub.lenderName}</strong>
                      <div style={{ color: '#64748b', fontSize: '0.8rem' }}>{sub.city}</div>
                    </td>
                    <td>
                      <span className="admin-pill muted">{sub.planName}</span>
                    </td>
                    <td className="mono">{formatBillingKES(sub.amount)}/mo</td>
                    <td>
                      <span className={`admin-pill ${subClass(sub.status)}`}>
                        {sub.status}
                        {sub.status === 'Grace' ? ` · ${getGraceDaysLeft(sub)}d` : ''}
                      </span>
                    </td>
                    <td>
                      {sub.status === 'Grace'
                        ? `Until ${sub.graceUntil}`
                        : sub.status === 'Frozen'
                          ? `Frozen ${sub.frozenAt ?? ''}`
                          : '—'}
                    </td>
                    <td>{sub.nextBilling}</td>
                    <td>
                      <div className="admin-row-actions">
                        {sub.status !== 'Active' && (
                          <button
                            type="button"
                            onClick={() =>
                              openPartnerManually(
                                'lender',
                                sub.accountId,
                                sub.lenderName,
                                sub.city,
                              )
                            }
                          >
                            Open monthly
                          </button>
                        )}
                        {(sub.status === 'Active' || sub.status === 'Trial') && (
                          <button type="button" onClick={() => markLenderPastDue(sub.accountId)}>
                            Start grace
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {tab === 'badges' && (
        <section className="admin-panel">
          <div className="admin-panel-head">
            <div>
              <h2>Dealer verified badges</h2>
              <p>
                {formatBillingKES(verifiedBadgeProduct.price)} · renews every{' '}
                {VERIFIED_BADGE_DURATION_MONTHS} months · dealers also buy this in Subscription
              </p>
            </div>
          </div>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Dealer</th>
                  <th>Amount</th>
                  <th>Badge</th>
                  <th>Source</th>
                  <th>Renews</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {badgeRows.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ color: '#64748b' }}>
                      No verified badge purchases yet.
                    </td>
                  </tr>
                )}
                {badgeRows.map((order) => (
                  <tr key={order.id}>
                    <td>
                      <strong>{order.dealerName}</strong>
                      <div style={{ color: '#64748b', fontSize: '0.8rem' }}>{order.city}</div>
                    </td>
                    <td className="mono">{formatBillingKES(order.amount)}</td>
                    <td>
                      <span className={`admin-pill ${badgeClass(order.status)}`}>
                        {order.status === 'Active' ? 'Verified' : order.status}
                      </span>
                    </td>
                    <td>
                      <span className={`admin-pill ${order.grantedByAdmin ? 'info' : 'muted'}`}>
                        {order.grantedByAdmin ? 'Admin grant' : 'Self serve'}
                      </span>
                    </td>
                    <td>{order.renews}</td>
                    <td>
                      <div className="admin-row-actions">
                        {order.status === 'Active' ? (
                          <button
                            type="button"
                            onClick={() => {
                              revokeDealerBadge(order.accountId)
                              setBadges(getDealerBadges())
                              flash('Verified badge revoked')
                            }}
                          >
                            Revoke badge
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              activateDealerBadge({
                                accountId: order.accountId,
                                dealerId: order.dealerId,
                                dealerName: order.dealerName,
                                city: order.city,
                                grantedByAdmin: true,
                              })
                              setBadges(getDealerBadges())
                              flash('Verified badge renewed')
                            }}
                          >
                            Renew badge
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </>
  )
}
