import { useMemo, useState, type FormEvent } from 'react'
import { adminAccounts } from '../data/admin'
import {
  agentBadgeOrders as seedBadges,
  agentBadgeProducts,
  agentPlans,
  agentSubscriptions as seedAgentSubs,
  dealerSubscriptions,
  formatBillingKES,
  type AgentBadgeOrder,
  type AgentSubscription,
  type BillingStatus,
} from '../data/billing'

function today() {
  return new Date().toISOString().slice(0, 10)
}

function nextMonth() {
  const d = new Date()
  d.setMonth(d.getMonth() + 1)
  return d.toISOString().slice(0, 10)
}

function nextYear() {
  const d = new Date()
  d.setFullYear(d.getFullYear() + 1)
  return d.toISOString().slice(0, 10)
}

export function AdminBilling() {
  const agents = useMemo(
    () => adminAccounts.filter((a) => a.role === 'Agent'),
    [],
  )

  const [tab, setTab] = useState<'dealers' | 'agents' | 'badges'>('agents')
  const [q, setQ] = useState('')
  const [toast, setToast] = useState('')

  const [agentSubs, setAgentSubs] = useState<AgentSubscription[]>(seedAgentSubs)
  const [badges, setBadges] = useState<AgentBadgeOrder[]>(seedBadges)

  const [subAgentId, setSubAgentId] = useState(agents[0]?.id ?? '')
  const [subPlanId, setSubPlanId] = useState(agentPlans[0]?.id ?? 'agent-basic')
  const [subStatus, setSubStatus] = useState<BillingStatus>('Active')

  const [badgeAgentId, setBadgeAgentId] = useState(agents[0]?.id ?? '')
  const [badgeProductId, setBadgeProductId] = useState(agentBadgeProducts[0]?.id ?? 'badge-monthly')

  const mrr =
    dealerSubscriptions
      .filter((s) => s.status === 'Active' || s.status === 'Past due')
      .reduce((sum, s) => sum + s.amount, 0) +
    agentSubs
      .filter((s) => s.status === 'Active' || s.status === 'Past due')
      .reduce((sum, s) => sum + s.amount, 0) +
    badges
      .filter((b) => b.status === 'Active' && b.billing === 'Monthly')
      .reduce((sum, b) => sum + b.amount, 0)

  const dealerRows = useMemo(() => {
    return dealerSubscriptions.filter((s) => {
      const hay = `${s.dealerName} ${s.planName} ${s.city}`.toLowerCase()
      return !q || hay.includes(q.toLowerCase())
    })
  }, [q])

  const agentSubRows = useMemo(() => {
    return agentSubs.filter((s) => {
      const hay = `${s.agentName} ${s.planName} ${s.city}`.toLowerCase()
      return !q || hay.includes(q.toLowerCase())
    })
  }, [q, agentSubs])

  const badgeRows = useMemo(() => {
    return badges.filter((b) => {
      const hay = `${b.agentName} ${b.city} ${b.billing}`.toLowerCase()
      return !q || hay.includes(q.toLowerCase())
    })
  }, [q, badges])

  function flash(message: string) {
    setToast(message)
    window.setTimeout(() => setToast(''), 2800)
  }

  function subClass(status: BillingStatus) {
    if (status === 'Active') return 'ok'
    if (status === 'Trial') return 'info'
    if (status === 'Past due') return 'warn'
    return 'danger'
  }

  function badgeClass(status: string) {
    if (status === 'Active') return 'ok'
    if (status === 'Pending payment') return 'warn'
    return 'muted'
  }

  function grantAgentSubscription(e: FormEvent) {
    e.preventDefault()
    const agent = agents.find((a) => a.id === subAgentId)
    const plan = agentPlans.find((p) => p.id === subPlanId)
    if (!agent || !plan) return

    const existing = agentSubs.find((s) => s.accountId === agent.id)
    const row: AgentSubscription = {
      id: existing?.id ?? `asub-${Date.now()}`,
      agentName: agent.name,
      accountId: agent.id,
      planId: plan.id,
      planName: plan.name,
      amount: plan.monthlyPrice,
      status: subStatus,
      startDate: existing?.startDate ?? today(),
      nextBilling: nextMonth(),
      city: agent.city,
      grantedByAdmin: true,
    }

    setAgentSubs((prev) => {
      if (existing) return prev.map((s) => (s.accountId === agent.id ? row : s))
      return [row, ...prev]
    })
    flash(`Granted ${plan.name} subscription to ${agent.name}`)
  }

  function grantVerifiedBadge(e: FormEvent) {
    e.preventDefault()
    const agent = agents.find((a) => a.id === badgeAgentId)
    const product = agentBadgeProducts.find((p) => p.id === badgeProductId)
    if (!agent || !product) return

    const existing = badges.find((b) => b.accountId === agent.id)
    const row: AgentBadgeOrder = {
      id: existing?.id ?? `badge-${Date.now()}`,
      agentName: agent.name,
      accountId: agent.id,
      productId: product.id,
      amount: product.price,
      billing: product.billing,
      status: 'Active',
      purchased: today(),
      renews: product.billing === 'Annual' ? nextYear() : nextMonth(),
      city: agent.city,
      grantedByAdmin: true,
    }

    setBadges((prev) => {
      if (existing) return prev.map((b) => (b.accountId === agent.id ? row : b))
      return [row, ...prev]
    })
    flash(`Verified badge granted to ${agent.name}`)
  }

  function revokeBadge(id: string) {
    setBadges((prev) =>
      prev.map((b) => (b.id === id ? { ...b, status: 'Expired' as const, renews: '—' } : b)),
    )
    flash('Verified badge revoked')
  }

  function activateBadge(id: string) {
    setBadges((prev) =>
      prev.map((b) =>
        b.id === id
          ? {
              ...b,
              status: 'Active' as const,
              renews: b.billing === 'Annual' ? nextYear() : nextMonth(),
              grantedByAdmin: true,
            }
          : b,
      ),
    )
    flash('Verified badge activated')
  }

  function cancelAgentSub(id: string) {
    setAgentSubs((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: 'Cancelled' as const } : s)),
    )
    flash('Agent subscription cancelled')
  }

  return (
    <>
      {toast && <div className="admin-toast">{toast}</div>}

      <div className="admin-grid-kpi">
        <article className="admin-kpi">
          <span>Est. monthly revenue</span>
          <strong style={{ fontSize: '1.25rem' }}>{formatBillingKES(mrr)}</strong>
          <em>Dealers + agents + badges</em>
        </article>
        <article className="admin-kpi">
          <span>Dealer plans</span>
          <strong>{dealerSubscriptions.filter((s) => s.status === 'Active').length}</strong>
          <em>Monthly subscriptions</em>
        </article>
        <article className="admin-kpi">
          <span>Agent subscriptions</span>
          <strong>{agentSubs.filter((s) => s.status === 'Active').length}</strong>
          <em>{agentSubs.filter((s) => s.grantedByAdmin).length} admin-granted</em>
        </article>
        <article className="admin-kpi">
          <span>Verified badges</span>
          <strong>{badges.filter((b) => b.status === 'Active').length}</strong>
          <em>{badges.filter((b) => b.grantedByAdmin && b.status === 'Active').length} admin-granted</em>
        </article>
      </div>

      <div className="admin-grant-grid">
        <form className="admin-panel admin-grant-card" onSubmit={grantAgentSubscription}>
          <div className="admin-panel-head">
            <div>
              <h2>Manually grant agent subscription</h2>
              <p>Assign or update an agent monthly plan without payment checkout</p>
            </div>
          </div>
          <div className="admin-grant-body">
            <div className="admin-grant-fields">
              <label>
                Agent account
                <select value={subAgentId} onChange={(e) => setSubAgentId(e.target.value)} required>
                  {agents.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} · {a.city}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Subscription plan
                <select value={subPlanId} onChange={(e) => setSubPlanId(e.target.value)} required>
                  {agentPlans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — {formatBillingKES(p.monthlyPrice)}/mo
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Status
                <select
                  value={subStatus}
                  onChange={(e) => setSubStatus(e.target.value as BillingStatus)}
                >
                  <option>Active</option>
                  <option>Trial</option>
                  <option>Past due</option>
                  <option>Cancelled</option>
                </select>
              </label>
            </div>
            <button type="submit" className="admin-btn admin-btn-primary">
              Grant subscription
            </button>
          </div>
        </form>

        <form className="admin-panel admin-grant-card" onSubmit={grantVerifiedBadge}>
          <div className="admin-panel-head">
            <div>
              <h2>Manually grant verified badge</h2>
              <p>Issue or renew an agent Verified Badge from admin</p>
            </div>
          </div>
          <div className="admin-grant-body">
            <div className="admin-grant-fields">
              <label>
                Agent account
                <select
                  value={badgeAgentId}
                  onChange={(e) => setBadgeAgentId(e.target.value)}
                  required
                >
                  {agents.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} · {a.city}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Badge package
                <select
                  value={badgeProductId}
                  onChange={(e) => setBadgeProductId(e.target.value)}
                  required
                >
                  {agentBadgeProducts.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.billing} — {formatBillingKES(p.price)}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <button type="submit" className="admin-btn admin-btn-primary">
              Grant verified badge
            </button>
          </div>
        </form>
      </div>

      <div className="admin-toolbar">
        <div>
          <h2>Billing &amp; monetization</h2>
          <p style={{ margin: '0.2rem 0 0', color: '#64748b', fontSize: '0.85rem' }}>
            Track dealer plans, agent subscriptions, and verified badges
          </p>
        </div>
        <div className="admin-toolbar-actions">
          <button
            type="button"
            className={`admin-btn ${tab === 'dealers' ? 'admin-btn-primary' : 'admin-btn-ghost'}`}
            onClick={() => setTab('dealers')}
          >
            Dealers
          </button>
          <button
            type="button"
            className={`admin-btn ${tab === 'agents' ? 'admin-btn-primary' : 'admin-btn-ghost'}`}
            onClick={() => setTab('agents')}
          >
            Agent subs
          </button>
          <button
            type="button"
            className={`admin-btn ${tab === 'badges' ? 'admin-btn-primary' : 'admin-btn-ghost'}`}
            onClick={() => setTab('badges')}
          >
            Badges
          </button>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…" />
        </div>
      </div>

      {tab === 'dealers' && (
        <section className="admin-panel">
          <div className="admin-panel-head">
            <div>
              <h2>Dealer monthly subscriptions</h2>
              <p>Starter · Growth · Enterprise</p>
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
                  <th>Started</th>
                  <th>Next billing</th>
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
                      <span className={`admin-pill ${subClass(sub.status)}`}>{sub.status}</span>
                    </td>
                    <td>{sub.startDate}</td>
                    <td>{sub.nextBilling}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {tab === 'agents' && (
        <section className="admin-panel">
          <div className="admin-panel-head">
            <div>
              <h2>Agent subscriptions</h2>
              <p>Including plans granted manually by admin</p>
            </div>
          </div>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Agent</th>
                  <th>Plan</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Source</th>
                  <th>Next billing</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {agentSubRows.map((sub) => (
                  <tr key={sub.id}>
                    <td>
                      <strong>{sub.agentName}</strong>
                      <div style={{ color: '#64748b', fontSize: '0.8rem' }}>{sub.city}</div>
                    </td>
                    <td>
                      <span className="admin-pill muted">{sub.planName}</span>
                    </td>
                    <td className="mono">{formatBillingKES(sub.amount)}/mo</td>
                    <td>
                      <span className={`admin-pill ${subClass(sub.status)}`}>{sub.status}</span>
                    </td>
                    <td>
                      <span className={`admin-pill ${sub.grantedByAdmin ? 'info' : 'muted'}`}>
                        {sub.grantedByAdmin ? 'Admin grant' : 'Self serve'}
                      </span>
                    </td>
                    <td>{sub.nextBilling}</td>
                    <td>
                      <div className="admin-row-actions">
                        {sub.status !== 'Cancelled' && (
                          <button type="button" onClick={() => cancelAgentSub(sub.id)}>
                            Cancel
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
              <h2>Agent verified badges</h2>
              <p>Purchase records and admin-issued badges</p>
            </div>
          </div>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Agent</th>
                  <th>Package</th>
                  <th>Amount</th>
                  <th>Badge</th>
                  <th>Source</th>
                  <th>Renews</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {badgeRows.map((order) => (
                  <tr key={order.id}>
                    <td>
                      <strong>{order.agentName}</strong>
                      <div style={{ color: '#64748b', fontSize: '0.8rem' }}>{order.city}</div>
                    </td>
                    <td>{order.billing}</td>
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
                          <button type="button" onClick={() => revokeBadge(order.id)}>
                            Revoke badge
                          </button>
                        ) : (
                          <button type="button" onClick={() => activateBadge(order.id)}>
                            Activate badge
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
