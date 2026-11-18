import { Link, useOutletContext } from 'react-router-dom'
import type { AuthSession } from '../data/auth'
import { dealerPlans } from '../data/billing'
import type { Dealer } from '../data/types'

type Ctx = { session: AuthSession; dealer?: Dealer }

export function DealerSubscription() {
  const { session } = useOutletContext<Ctx>()
  const current =
    dealerPlans.find((p) => p.name.toLowerCase() === (session.plan ?? '').toLowerCase()) ??
    dealerPlans[0]

  return (
    <>
      <div className="admin-toolbar">
        <div>
          <h2>Subscription</h2>
          <p style={{ margin: '0.2rem 0 0', color: '#64748b', fontSize: '0.85rem' }}>
            Your Kenya Vehicles dealer plan and billing status
          </p>
        </div>
        <Link to="/pricing" className="admin-btn admin-btn-primary">
          Compare plans
        </Link>
      </div>

      <div className="admin-grant-grid">
        <section className="admin-panel admin-grant-card">
          <div className="admin-panel-head">
            <div>
              <h2>Current plan</h2>
              <p>Active for {session.name}</p>
            </div>
            <span className="admin-pill ok">Active</span>
          </div>
          <div className="admin-grant-body">
            <strong style={{ fontSize: '1.35rem' }}>{session.plan ?? current.name}</strong>
            <p style={{ margin: 0, color: '#64748b' }}>
              KES {current.monthlyPrice.toLocaleString()} / month · {current.featuredSlots} featured
              slots
            </p>
            <ul style={{ margin: '0.5rem 0 0', paddingLeft: '1.1rem', color: '#374151' }}>
              {current.perks.map((f) => (
                <li key={f} style={{ marginBottom: '0.25rem' }}>
                  {f}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="admin-panel admin-grant-card">
          <div className="admin-panel-head">
            <div>
              <h2>Need more reach?</h2>
              <p>Upgrade for more featured homepage slots</p>
            </div>
          </div>
          <div className="admin-grant-body" style={{ gap: '0.65rem' }}>
            {dealerPlans.map((plan) => (
              <div
                key={plan.id}
                style={{
                  border: '1px solid var(--admin-line)',
                  borderRadius: 10,
                  padding: '0.75rem 0.85rem',
                  background: plan.name === (session.plan ?? current.name) ? '#ecfeff' : '#fff',
                }}
              >
                <strong>{plan.name}</strong>
                <div style={{ color: '#64748b', fontSize: '0.85rem' }}>
                  KES {plan.monthlyPrice.toLocaleString()}/mo · {plan.featuredSlots} featured
                </div>
              </div>
            ))}
            <Link to="/pricing" className="admin-btn admin-btn-ghost">
              Open pricing page
            </Link>
          </div>
        </section>
      </div>
    </>
  )
}
