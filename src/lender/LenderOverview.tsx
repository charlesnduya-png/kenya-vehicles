import { useEffect, useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import type { AuthSession } from '../data/auth'
import { formatKES } from '../data/cars'
import {
  getEnquiriesForLoanPartner,
  subscribeEnquiries,
} from '../data/enquiries'
import { getLoanPartner, subscribeLoanPartners } from '../data/loans'
import type { LoanPartner } from '../data/types'

type Ctx = { session: AuthSession; partner?: LoanPartner }

export function LenderOverview() {
  const { session } = useOutletContext<Ctx>()
  const [partner, setPartner] = useState(() =>
    session.loanPartnerId ? getLoanPartner(session.loanPartnerId) : undefined,
  )
  const [apps, setApps] = useState(() =>
    session.loanPartnerId ? getEnquiriesForLoanPartner(session.loanPartnerId) : [],
  )

  useEffect(() => {
    if (!session.loanPartnerId) return
    const refresh = () => setApps(getEnquiriesForLoanPartner(session.loanPartnerId!))
    refresh()
    return subscribeEnquiries(refresh)
  }, [session.loanPartnerId])

  useEffect(() => {
    if (!session.loanPartnerId) return
    const refresh = () => setPartner(getLoanPartner(session.loanPartnerId!))
    refresh()
    return subscribeLoanPartners(refresh)
  }, [session.loanPartnerId])

  const newCount = apps.filter((a) => a.status === 'New').length
  const openCount = apps.filter((a) => a.status !== 'Closed').length

  return (
    <>
      <div className="admin-grid-kpi">
        <article className="admin-kpi">
          <span>New applications</span>
          <strong>{newCount}</strong>
          <em>Awaiting your follow-up</em>
        </article>
        <article className="admin-kpi">
          <span>Open pipeline</span>
          <strong>{openCount}</strong>
          <em>{apps.length} total received</em>
        </article>
        <article className="admin-kpi">
          <span>Rate band</span>
          <strong style={{ fontSize: '1.15rem' }}>
            {partner ? `${partner.rateFrom}%–${partner.rateTo}%` : '—'}
          </strong>
          <em>Published on listings</em>
        </article>
        <article className="admin-kpi">
          <span>Max loan</span>
          <strong style={{ fontSize: '1.15rem' }}>
            {partner ? formatKES(partner.maxLoan) : '—'}
          </strong>
          <em>From {partner?.minDepositPercent ?? '—'}% deposit</em>
        </article>
      </div>

      <div className="admin-split">
        <section className="admin-panel">
          <div className="admin-panel-head">
            <div>
              <h2>Partner snapshot</h2>
              <p>How buyers see your loan offer on Kenya Vehicles</p>
            </div>
            <Link to="/loans" className="admin-btn admin-btn-ghost" target="_blank">
              Public loans page
            </Link>
          </div>
          <div style={{ padding: '0 1.2rem 1.2rem' }}>
            <h3
              style={{
                margin: '0 0 0.35rem',
                fontSize: '1.1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
              }}
            >
              {partner?.logo && (
                <img
                  src={partner.logo}
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
            </h3>
            <p style={{ margin: 0, color: '#64748b', lineHeight: 1.45 }}>
              {partner?.highlight ?? 'Complete your partner profile to attract more financed buyers.'}
            </p>
            <div style={{ display: 'flex', gap: '1.25rem', marginTop: '1rem', flexWrap: 'wrap' }}>
              <div>
                <strong>{partner?.type ?? '—'}</strong>
                <div style={{ color: '#64748b', fontSize: '0.8rem' }}>Type</div>
              </div>
              <div>
                <strong>★ {partner?.rating ?? '—'}</strong>
                <div style={{ color: '#64748b', fontSize: '0.8rem' }}>
                  {partner?.reviewCount ?? 0} reviews
                </div>
              </div>
              <div>
                <strong>{partner ? `${partner.maxTermMonths} mo` : '—'}</strong>
                <div style={{ color: '#64748b', fontSize: '0.8rem' }}>Max term</div>
              </div>
            </div>
          </div>
        </section>

        <section className="admin-panel">
          <div className="admin-panel-head">
            <div>
              <h2>Quick actions</h2>
              <p>Work buyer loan requests from dealer yards</p>
            </div>
          </div>
          <div style={{ padding: '0 1.2rem 1.2rem', display: 'grid', gap: '0.55rem' }}>
            <Link to="/lender/applications" className="admin-btn admin-btn-primary">
              Review applications{newCount > 0 ? ` (${newCount} new)` : ''}
            </Link>
            <Link to="/lender/profile" className="admin-btn admin-btn-ghost">
              Edit partner profile
            </Link>
            <Link to="/loans" className="admin-btn admin-btn-ghost">
              View borrower calculator
            </Link>
          </div>
        </section>
      </div>
    </>
  )
}
