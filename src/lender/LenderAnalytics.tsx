import { useEffect, useMemo, useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import { formatAnalyticsKES, getLenderOwnAnalytics } from '../data/analytics'
import type { AuthSession } from '../data/auth'
import { formatKES } from '../data/cars'
import { subscribeEnquiries } from '../data/enquiries'
import type { LoanPartner } from '../data/types'

type Ctx = { session: AuthSession; partner?: LoanPartner }

export function LenderAnalytics() {
  const { session, partner } = useOutletContext<Ctx>()
  const [tick, setTick] = useState(0)

  useEffect(() => subscribeEnquiries(() => setTick((n) => n + 1)), [])

  const stats = useMemo(() => {
    void tick
    return session.loanPartnerId
      ? getLenderOwnAnalytics(session.loanPartnerId)
      : null
  }, [session.loanPartnerId, tick])

  if (!stats) {
    return <div className="admin-empty">No analytics available for this account.</div>
  }

  const maxYard = Math.max(...stats.topYards.map((y) => y.count), 1)
  const maxUnit = Math.max(...stats.topUnits.map((u) => u.count), 1)

  return (
    <>
      <div className="admin-toolbar">
        <div>
          <h2>Your loan analysis</h2>
          <p style={{ margin: '0.2rem 0 0', color: '#64748b', fontSize: '0.85rem' }}>
            Pipeline performance for {partner?.name ?? session.name} on Kenya Vehicles
          </p>
        </div>
        <div className="admin-toolbar-actions">
          <Link to="/lender/applications" className="admin-btn admin-btn-ghost">
            Open applications
          </Link>
          <span className="admin-pill info">{stats.total} total apps</span>
        </div>
      </div>

      <div className="admin-grid-kpi">
        <article className="admin-kpi">
          <span>New applications</span>
          <strong>{stats.newCount}</strong>
          <em>Waiting for your follow-up</em>
        </article>
        <article className="admin-kpi">
          <span>Accepted</span>
          <strong>{stats.accepted}</strong>
          <em>{stats.acceptanceRate}% accept rate vs declined</em>
        </article>
        <article className="admin-kpi">
          <span>Declined</span>
          <strong>{stats.declined}</strong>
          <em>{stats.replied} marked contacted</em>
        </article>
        <article className="admin-kpi">
          <span>Est. monthly volume</span>
          <strong style={{ fontSize: '1.15rem' }}>
            {formatAnalyticsKES(stats.estimatedMonthlyVolume)}
          </strong>
          <em>From active buyer asks</em>
        </article>
      </div>

      <div className="admin-grid-kpi">
        <article className="admin-kpi">
          <span>Accepted unit value</span>
          <strong style={{ fontSize: '1.15rem' }}>{formatKES(stats.financedValue)}</strong>
          <em>Sum of accepted car prices</em>
        </article>
        <article className="admin-kpi">
          <span>Closed / done</span>
          <strong>{stats.closed}</strong>
          <em>Manually closed applications</em>
        </article>
        <article className="admin-kpi">
          <span>Yards engaged</span>
          <strong>{stats.topYards.length}</strong>
          <em>Dealers sending you loan buyers</em>
        </article>
        <article className="admin-kpi">
          <span>Units inquired</span>
          <strong>{stats.topUnits.length}</strong>
          <em>Distinct cars in your pipeline</em>
        </article>
      </div>

      <div className="admin-split">
        <section className="admin-panel">
          <div className="admin-panel-head">
            <div>
              <h2>Top dealer yards</h2>
              <p>Where your loan applications come from</p>
            </div>
          </div>
          <div style={{ padding: '0 1.2rem 1.2rem', display: 'grid', gap: '0.75rem' }}>
            {stats.topYards.length === 0 && (
              <div className="admin-empty">No yard activity yet.</div>
            )}
            {stats.topYards.map((yard) => (
              <div key={yard.dealerId}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: '0.75rem',
                    marginBottom: '0.35rem',
                  }}
                >
                  <strong>{yard.dealerName}</strong>
                  <span style={{ color: '#64748b', fontSize: '0.85rem' }}>
                    {yard.count} apps · {yard.accepted} accepted
                  </span>
                </div>
                <div
                  style={{
                    height: 8,
                    borderRadius: 999,
                    background: '#e2e8f0',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${(yard.count / maxYard) * 100}%`,
                      height: '100%',
                      background: '#0f766e',
                    }}
                  />
                </div>
                <Link
                  to={`/dealers/${yard.dealerId}`}
                  target="_blank"
                  style={{ fontSize: '0.8rem' }}
                >
                  View yard
                </Link>
              </div>
            ))}
          </div>
        </section>

        <section className="admin-panel">
          <div className="admin-panel-head">
            <div>
              <h2>Most inquired units</h2>
              <p>Cars buyers want to finance with you</p>
            </div>
          </div>
          <div style={{ padding: '0 1.2rem 1.2rem', display: 'grid', gap: '0.75rem' }}>
            {stats.topUnits.length === 0 && (
              <div className="admin-empty">No units in your pipeline yet.</div>
            )}
            {stats.topUnits.map((unit) => (
              <div key={`${unit.carId ?? unit.label}`}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: '0.75rem',
                    marginBottom: '0.35rem',
                  }}
                >
                  <strong>{unit.label}</strong>
                  <span style={{ color: '#64748b', fontSize: '0.85rem' }}>
                    {unit.count} ask{unit.count === 1 ? '' : 's'}
                    {unit.price != null ? ` · ${formatKES(unit.price)}` : ''}
                  </span>
                </div>
                <div
                  style={{
                    height: 8,
                    borderRadius: 999,
                    background: '#e2e8f0',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${(unit.count / maxUnit) * 100}%`,
                      height: '100%',
                      background: '#0369a1',
                    }}
                  />
                </div>
                {unit.carId && (
                  <Link to={`/cars/${unit.carId}`} target="_blank" style={{ fontSize: '0.8rem' }}>
                    Open unit
                  </Link>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  )
}
