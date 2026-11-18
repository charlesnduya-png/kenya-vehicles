import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  formatAnalyticsKES,
  getApplicationBreakdown,
  getLeadingDealers,
  getLeadingLenders,
} from '../data/analytics'
import { formatKES } from '../data/cars'
import { subscribeEnquiries } from '../data/enquiries'
import { subscribeLoanPartners } from '../data/loans'
import { subscribeOffers } from '../data/offers'
import { VerifiedBadge } from '../components/VerifiedBadge'

export function AdminAnalytics() {
  const [tick, setTick] = useState(0)

  useEffect(() => {
    const refresh = () => setTick((n) => n + 1)
    const offEnquiries = subscribeEnquiries(refresh)
    const offOffers = subscribeOffers(refresh)
    const offLenders = subscribeLoanPartners(refresh)
    return () => {
      offEnquiries()
      offOffers()
      offLenders()
    }
  }, [])

  const apps = useMemo(() => {
    void tick
    return getApplicationBreakdown()
  }, [tick])

  const dealers = useMemo(() => {
    void tick
    return getLeadingDealers(8)
  }, [tick])

  const lenders = useMemo(() => {
    void tick
    return getLeadingLenders(8)
  }, [tick])

  const maxDealerScore = Math.max(...dealers.map((d) => d.score), 1)
  const maxLenderScore = Math.max(...lenders.map((l) => l.score), 1)
  const maxAppSlice = Math.max(apps.carSale, apps.loan, 1)

  return (
    <>
      <div className="admin-toolbar">
        <div>
          <h2>Platform analytics</h2>
          <p style={{ margin: '0.2rem 0 0', color: '#64748b', fontSize: '0.85rem' }}>
            Live application mix, leading sales dealers, and top lenders
          </p>
        </div>
        <div className="admin-toolbar-actions">
          <Link to="/admin/enquiries" className="admin-btn admin-btn-ghost">
            Open enquiries
          </Link>
          <span className="admin-pill info">{apps.total} live applications</span>
        </div>
      </div>

      <div className="admin-grid-kpi">
        <article className="admin-kpi">
          <span>Total applications</span>
          <strong>{apps.total}</strong>
          <em>{apps.newCount} new · {apps.replied} replied · {apps.closed} closed</em>
        </article>
        <article className="admin-kpi">
          <span>Car sale leads</span>
          <strong>{apps.carSale}</strong>
          <em>Buyer enquiries on listings</em>
        </article>
        <article className="admin-kpi">
          <span>Loan applications</span>
          <strong>{apps.loan}</strong>
          <em>
            +{apps.adminLoanPipeline} open in admin pipeline · est.{' '}
            {formatAnalyticsKES(apps.estimatedLoanMonthlyValue)}/mo
          </em>
        </article>
        <article className="admin-kpi">
          <span>Lead conversion signal</span>
          <strong>
            {apps.total === 0
              ? '—'
              : `${Math.round(((apps.replied + apps.closed) / apps.total) * 100)}%`}
          </strong>
          <em>Replied or closed vs total live apps</em>
        </article>
      </div>

      <section className="admin-panel" style={{ marginBottom: '1rem' }}>
        <div className="admin-panel-head">
          <div>
            <h2>Application mix</h2>
            <p>Share of live car-sale vs loan purchase requests</p>
          </div>
        </div>
        <div className="admin-analytics-mix">
          <div className="admin-analytics-mix-row">
            <div className="admin-analytics-mix-label">
              <strong>Car sale</strong>
              <span>{apps.carSale}</span>
            </div>
            <div className="admin-analytics-track">
              <div
                className="admin-analytics-fill sales"
                style={{ width: `${(apps.carSale / maxAppSlice) * 100}%` }}
              />
            </div>
          </div>
          <div className="admin-analytics-mix-row">
            <div className="admin-analytics-mix-label">
              <strong>Loan purchase</strong>
              <span>{apps.loan}</span>
            </div>
            <div className="admin-analytics-track">
              <div
                className="admin-analytics-fill loans"
                style={{ width: `${(apps.loan / maxAppSlice) * 100}%` }}
              />
            </div>
          </div>
          {apps.total === 0 && (
            <p className="admin-analytics-empty">
              No live marketplace applications yet. Rankings below still use inventory, ratings, and
              partner strength until buyers start applying.
            </p>
          )}
        </div>
      </section>

      <div className="admin-split">
        <section className="admin-panel">
          <div className="admin-panel-head">
            <div>
              <h2>Leading sales dealers</h2>
              <p>Ranked by enquiries, offers, stock, rating, and verification</p>
            </div>
            <Link to="/admin/dealers" className="admin-btn admin-btn-ghost">
              Manage dealers
            </Link>
          </div>
          <div className="admin-analytics-list">
            {dealers.map((dealer, index) => (
              <article key={dealer.id} className="admin-analytics-row">
                <div className="admin-analytics-rank">#{index + 1}</div>
                <div className="admin-analytics-main">
                  <div className="admin-analytics-title">
                    <strong className="with-verified">
                      <span>{dealer.name}</span>
                      {dealer.verified && <VerifiedBadge title="Verified dealer" size={14} />}
                    </strong>
                    <span>
                      {dealer.city} · ★ {dealer.rating} · {dealer.listings} cars ·{' '}
                      {formatKES(dealer.inventoryValue)}
                    </span>
                  </div>
                  <div className="admin-analytics-track">
                    <div
                      className="admin-analytics-fill sales"
                      style={{ width: `${(dealer.score / maxDealerScore) * 100}%` }}
                    />
                  </div>
                  <div className="admin-analytics-meta">
                    <span>{dealer.saleEnquiries} sale leads</span>
                    <span>{dealer.loanEnquiries} loan asks</span>
                    <span>
                      {dealer.offers} offers ({dealer.acceptedOffers} accepted)
                    </span>
                    <span>Score {dealer.score}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="admin-panel">
          <div className="admin-panel-head">
            <div>
              <h2>Leading lenders</h2>
              <p>Ranked by loan applications, pipeline, and public rating</p>
            </div>
            <Link to="/admin/loans" className="admin-btn admin-btn-ghost">
              Manage lenders
            </Link>
          </div>
          <div className="admin-analytics-list">
            {lenders.map((lender, index) => (
              <article key={lender.id} className="admin-analytics-row">
                <div className="admin-analytics-rank">#{index + 1}</div>
                <div className="admin-analytics-main">
                  <div className="admin-analytics-title">
                    <strong>{lender.name}</strong>
                    <span>
                      {lender.type} · ★ {lender.rating} ({lender.reviewCount} reviews)
                    </span>
                  </div>
                  <div className="admin-analytics-track">
                    <div
                      className="admin-analytics-fill loans"
                      style={{ width: `${(lender.score / maxLenderScore) * 100}%` }}
                    />
                  </div>
                  <div className="admin-analytics-meta">
                    <span>{lender.applications} applications</span>
                    <span>{lender.newApplications} new</span>
                    <span>{lender.closedApplications} closed</span>
                    <span>
                      Est. {formatAnalyticsKES(lender.estimatedMonthlyVolume)}/mo
                    </span>
                    <span>Score {lender.score}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </>
  )
}
