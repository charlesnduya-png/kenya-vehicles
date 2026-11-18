import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { VerifiedBadge } from '../components/VerifiedBadge'
import {
  adminAccounts,
  adminActivity,
  adminEnquiries,
  monthlyStats,
} from '../data/admin'
import {
  getApplicationBreakdown,
  getLeadingDealers,
  getLeadingLenders,
} from '../data/analytics'
import { formatKES, getCars } from '../data/cars'
import { dealers } from '../data/dealers'
import { subscribeEnquiries } from '../data/enquiries'
import { loanPartners } from '../data/loans'
import { subscribeOffers } from '../data/offers'
import { dealersWithRentals, getRentals } from '../data/rentals'

export function AdminOverview() {
  const [tick, setTick] = useState(0)
  const saleStock = getCars()
  const liveListings = saleStock.length
  const fleet = getRentals()
  const liveRentals = fleet.filter((r) => r.available).length
  const activeAccounts = adminAccounts.filter((a) => a.status === 'Active').length
  const openEnquiries = adminEnquiries.filter((e) => e.status !== 'Closed').length
  const inventoryValue = saleStock.reduce((sum, c) => sum + c.price, 0)
  const maxBar = Math.max(...monthlyStats.flatMap((m) => [m.sales, m.hires, m.loans]))

  useEffect(() => {
    const refresh = () => setTick((n) => n + 1)
    const offA = subscribeEnquiries(refresh)
    const offB = subscribeOffers(refresh)
    return () => {
      offA()
      offB()
    }
  }, [])

  const apps = useMemo(() => {
    void tick
    return getApplicationBreakdown()
  }, [tick])
  const topDealers = useMemo(() => {
    void tick
    return getLeadingDealers(3)
  }, [tick])
  const topLenders = useMemo(() => {
    void tick
    return getLeadingLenders(3)
  }, [tick])

  return (
    <>
      <div className="admin-grid-kpi">
        <article className="admin-kpi">
          <span>Sale listings</span>
          <strong>{liveListings}</strong>
          <em>+8% vs last month</em>
        </article>
        <article className="admin-kpi">
          <span>Rentals available</span>
          <strong>{liveRentals}</strong>
          <em>+12% hire demand</em>
        </article>
        <article className="admin-kpi">
          <span>Active accounts</span>
          <strong>{activeAccounts}</strong>
          <em>{adminAccounts.filter((a) => a.status === 'Pending').length} pending review</em>
        </article>
        <article className="admin-kpi">
          <span>Open enquiries</span>
          <strong>{openEnquiries}</strong>
          <em className="down">{adminEnquiries.filter((e) => e.status === 'New').length} new today</em>
        </article>
      </div>

      <div className="admin-grid-kpi">
        <article className="admin-kpi">
          <span>Dealers</span>
          <strong>{dealers.length}</strong>
          <em>{dealers.filter((d) => d.verified).length} verified</em>
        </article>
        <article className="admin-kpi">
          <span>Dealers with rentals</span>
          <strong>{dealersWithRentals().length}</strong>
          <em>{fleet.length} hire cars listed</em>
        </article>
        <article className="admin-kpi">
          <span>Loan partners</span>
          <strong>{loanPartners.length}</strong>
          <em>Banks · Saccos · Fintech</em>
        </article>
        <article className="admin-kpi">
          <span>Listed inventory value</span>
          <strong style={{ fontSize: '1.15rem' }}>{formatKES(inventoryValue)}</strong>
          <em>Across all sale stock</em>
        </article>
      </div>

      <div className="admin-split" style={{ marginBottom: '1rem' }}>
        <section className="admin-panel">
          <div className="admin-panel-head">
            <div>
              <h2>Application analysis</h2>
              <p>Live buyer enquiries and loan purchase requests</p>
            </div>
            <Link to="/admin/analytics" className="admin-btn admin-btn-ghost">
              Full analytics
            </Link>
          </div>
          <div className="admin-analytics-compact">
            <div className="admin-analytics-compact-row">
              <strong>Total applications</strong>
              <em>{apps.total} live</em>
            </div>
            <div className="admin-analytics-compact-row">
              <strong>Car sale leads</strong>
              <em>{apps.carSale}</em>
            </div>
            <div className="admin-analytics-compact-row">
              <strong>Loan applications</strong>
              <em>
                {apps.loan} · {apps.newCount} new
              </em>
            </div>
            <div className="admin-analytics-compact-row">
              <strong>Worked rate</strong>
              <em>
                {apps.total === 0
                  ? '—'
                  : `${Math.round(((apps.replied + apps.closed) / apps.total) * 100)}%`}
              </em>
            </div>
          </div>
        </section>

        <section className="admin-panel">
          <div className="admin-panel-head">
            <div>
              <h2>Leading partners</h2>
              <p>Top sales dealers and lenders right now</p>
            </div>
            <Link to="/admin/analytics" className="admin-btn admin-btn-primary">
              View rankings
            </Link>
          </div>
          <div className="admin-analytics-compact">
            <div>
              <em style={{ color: '#64748b', fontSize: '0.78rem', fontWeight: 700 }}>
                Dealers
              </em>
              {topDealers.map((d, i) => (
                <div key={d.id} className="admin-analytics-compact-row" style={{ marginTop: '0.45rem' }}>
                  <strong className="with-verified">
                    #{i + 1} {d.name}
                    {d.verified && <VerifiedBadge title="Verified dealer" size={13} />}
                  </strong>
                  <em>
                    {d.saleEnquiries + d.loanEnquiries} apps · ★ {d.rating}
                  </em>
                </div>
              ))}
            </div>
            <div style={{ marginTop: '0.65rem' }}>
              <em style={{ color: '#64748b', fontSize: '0.78rem', fontWeight: 700 }}>
                Lenders
              </em>
              {topLenders.map((l, i) => (
                <div key={l.id} className="admin-analytics-compact-row" style={{ marginTop: '0.45rem' }}>
                  <strong>
                    #{i + 1} {l.name}
                  </strong>
                  <em>
                    {l.applications} loans · ★ {l.rating}
                  </em>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      <div className="admin-split">
        <section className="admin-panel">
          <div className="admin-panel-head">
            <div>
              <h2>Marketplace activity</h2>
              <p>Sales leads, hire bookings, and loan applications</p>
            </div>
          </div>
          <div className="admin-bars">
            {monthlyStats.map((m) => (
              <div key={m.label} className="admin-bar-col">
                <div className="admin-bar-stack">
                  <div
                    className="admin-bar sales"
                    style={{ height: `${(m.sales / maxBar) * 100}%` }}
                    title={`Sales ${m.sales}`}
                  />
                  <div
                    className="admin-bar hires"
                    style={{ height: `${(m.hires / maxBar) * 100}%` }}
                    title={`Hires ${m.hires}`}
                  />
                  <div
                    className="admin-bar loans"
                    style={{ height: `${(m.loans / maxBar) * 100}%` }}
                    title={`Loans ${m.loans}`}
                  />
                </div>
                <span>{m.label}</span>
              </div>
            ))}
          </div>
          <div className="admin-legend">
            <span>
              <i style={{ background: '#0f766e' }} /> Sales
            </span>
            <span>
              <i style={{ background: '#2563eb' }} /> Hires
            </span>
            <span>
              <i style={{ background: '#d97706' }} /> Loans
            </span>
          </div>
        </section>

        <section className="admin-panel">
          <div className="admin-panel-head">
            <div>
              <h2>Live activity</h2>
              <p>Latest platform events</p>
            </div>
            <Link to="/admin/enquiries" className="admin-btn admin-btn-ghost">
              View all
            </Link>
          </div>
          <ul className="admin-activity">
            {adminActivity.map((item) => (
              <li key={`${item.time}-${item.text}`}>
                <time>{item.time}</time>
                <span>{item.text}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="admin-panel">
        <div className="admin-panel-head">
          <div>
            <h2>Needs attention</h2>
            <p>Pending accounts and open enquiries requiring action</p>
          </div>
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Type</th>
                <th>Contact</th>
                <th>Status</th>
                <th>Created</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {adminAccounts
                .filter((a) => a.status === 'Pending' || a.status === 'Suspended')
                .map((a) => (
                  <tr key={a.id}>
                    <td>
                      <strong>{a.name}</strong>
                      <div style={{ color: '#64748b', fontSize: '0.8rem' }}>{a.email}</div>
                    </td>
                    <td>{a.role}</td>
                    <td>{a.phone}</td>
                    <td>
                      <span className={`admin-pill ${a.status === 'Pending' ? 'warn' : 'danger'}`}>
                        {a.status}
                      </span>
                    </td>
                    <td>{a.joined}</td>
                    <td>
                      <div className="admin-row-actions">
                        <Link to="/admin/accounts">
                          <button type="button">Review</button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              {adminEnquiries
                .filter((e) => e.status === 'New')
                .map((e) => (
                  <tr key={e.id}>
                    <td>
                      <strong>{e.subject}</strong>
                      <div style={{ color: '#64748b', fontSize: '0.8rem' }}>{e.related}</div>
                    </td>
                    <td>{e.type}</td>
                    <td>
                      {e.customer}
                      <div style={{ color: '#64748b', fontSize: '0.8rem' }}>{e.phone}</div>
                    </td>
                    <td>
                      <span className="admin-pill info">{e.status}</span>
                    </td>
                    <td>{e.created}</td>
                    <td>
                      <div className="admin-row-actions">
                        <Link to="/admin/enquiries">
                          <button type="button">Open</button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  )
}
