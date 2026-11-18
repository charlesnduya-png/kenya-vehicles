import { useEffect, useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import { VerifiedBadge } from '../components/VerifiedBadge'
import type { AuthSession } from '../data/auth'
import { getCarsByDealer } from '../data/cars'
import { getEnquiriesForDealer, subscribeEnquiries } from '../data/enquiries'
import type { Dealer } from '../data/types'

type Ctx = { session: AuthSession; dealer?: Dealer }

export function DealerOverview() {
  const { session, dealer } = useOutletContext<Ctx>()
  const stock = session.dealerId ? getCarsByDealer(session.dealerId) : []
  const featured = stock.filter((c) => c.featured).length
  const [enquiries, setEnquiries] = useState(() =>
    session.dealerId ? getEnquiriesForDealer(session.dealerId) : [],
  )

  useEffect(() => {
    if (!session.dealerId) return
    const refresh = () => setEnquiries(getEnquiriesForDealer(session.dealerId!))
    refresh()
    return subscribeEnquiries(refresh)
  }, [session.dealerId])

  const newEnquiries = enquiries.filter((e) => e.status === 'New').length
  const loanRequests = enquiries.filter((e) => e.type === 'Loan').length

  return (
    <>
      <div className="admin-grid-kpi">
        <article className="admin-kpi">
          <span>Live listings</span>
          <strong>{stock.length}</strong>
          <em>{featured} featured on homepage</em>
        </article>
        <article className="admin-kpi">
          <span>Open enquiries</span>
          <strong>{newEnquiries}</strong>
          <em>
            {loanRequests} loan purchase request{loanRequests === 1 ? '' : 's'}
          </em>
        </article>
        <article className="admin-kpi">
          <span>Yard rating</span>
          <strong>★ {dealer?.rating ?? '—'}</strong>
          <em>{dealer?.reviewCount ?? 0} reviews</em>
        </article>
        <article className="admin-kpi">
          <span>Subscription</span>
          <strong style={{ fontSize: '1.15rem' }}>{session.plan ?? 'Starter'}</strong>
          <em>
            <Link to="/dealer/subscription">Manage plan</Link>
          </em>
        </article>
      </div>

      <div className="admin-split">
        <section className="admin-panel">
          <div className="admin-panel-head">
            <div>
              <h2>Yard snapshot</h2>
              <p>How buyers see your Kenya Vehicles presence</p>
            </div>
            {dealer && (
              <Link to={`/dealers/${dealer.id}`} className="admin-btn admin-btn-ghost" target="_blank">
                Public page
              </Link>
            )}
          </div>
          <div style={{ padding: '0 1.2rem 1.2rem' }}>
            <h3
              className="with-verified"
              style={{
                margin: '0 0 0.35rem',
                fontSize: '1.1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
              }}
            >
              {dealer?.logo && (
                <img
                  src={dealer.logo}
                  alt=""
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    objectFit: 'cover',
                    border: '1px solid #e5e7eb',
                  }}
                />
              )}
              <span>{session.name}</span>
              {dealer?.verified && <VerifiedBadge title="Verified dealer" size={16} />}
            </h3>
            <p style={{ margin: 0, color: '#64748b', lineHeight: 1.45 }}>
              {dealer?.bio ?? 'Complete your yard profile to attract more buyers.'}
            </p>
            <div style={{ display: 'flex', gap: '1.25rem', marginTop: '1rem', flexWrap: 'wrap' }}>
              <div>
                <strong>{dealer?.specialty ?? '—'}</strong>
                <div style={{ color: '#64748b', fontSize: '0.8rem' }}>Specialty</div>
              </div>
              <div>
                <strong>
                  {dealer?.city}, {dealer?.county}
                </strong>
                <div style={{ color: '#64748b', fontSize: '0.8rem' }}>Location</div>
              </div>
              <div>
                <strong>{dealer?.yearsActive ?? '—'} yrs</strong>
                <div style={{ color: '#64748b', fontSize: '0.8rem' }}>Active</div>
              </div>
            </div>
          </div>
        </section>

        <section className="admin-panel">
          <div className="admin-panel-head">
            <div>
              <h2>Quick actions</h2>
              <p>Keep your yard moving</p>
            </div>
          </div>
          <div style={{ padding: '0 1.2rem 1.2rem', display: 'grid', gap: '0.55rem' }}>
            <Link to="/dealer/inventory" className="admin-btn admin-btn-primary">
              Manage inventory
            </Link>
            <Link to="/dealer/rentals" className="admin-btn admin-btn-ghost">
              List hire / rental cars
            </Link>
            <Link to="/dealer/enquiries" className="admin-btn admin-btn-ghost">
              Review buyer enquiries
              {newEnquiries > 0 ? ` (${newEnquiries} new)` : ''}
            </Link>
            <Link to="/dealer/offers" className="admin-btn admin-btn-ghost">
              Review customer offers
            </Link>
            <Link to="/dealer/messages" className="admin-btn admin-btn-ghost">
              Open message inbox
            </Link>
            <Link to="/pricing" className="admin-btn admin-btn-ghost">
              Upgrade subscription
            </Link>
          </div>
        </section>
      </div>
    </>
  )
}
