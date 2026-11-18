import { useEffect, useMemo, useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import type { AuthSession } from '../data/auth'
import { formatKES } from '../data/cars'
import {
  getEnquiriesForLoanPartner,
  setLoanLenderDecision,
  subscribeEnquiries,
  updateEnquiryStatus,
  type EnquiryStatus,
  type YardEnquiry,
} from '../data/enquiries'
import type { LoanPartner } from '../data/types'

type Ctx = { session: AuthSession; partner?: LoanPartner }

export function LenderApplications() {
  const { session, partner } = useOutletContext<Ctx>()
  const [status, setStatus] = useState<'All' | EnquiryStatus>('All')
  const [rows, setRows] = useState<YardEnquiry[]>(() =>
    session.loanPartnerId ? getEnquiriesForLoanPartner(session.loanPartnerId) : [],
  )

  useEffect(() => {
    if (!session.loanPartnerId) return
    const refresh = () => setRows(getEnquiriesForLoanPartner(session.loanPartnerId!))
    refresh()
    return subscribeEnquiries(refresh)
  }, [session.loanPartnerId])

  const filtered = useMemo(
    () => rows.filter((r) => status === 'All' || r.status === status),
    [rows, status],
  )

  function statusClass(s: EnquiryStatus) {
    if (s === 'New') return 'info'
    if (s === 'Replied') return 'warn'
    if (s === 'Accepted') return 'ok'
    if (s === 'Declined') return 'danger'
    return 'muted'
  }

  function formatWhen(iso: string) {
    try {
      return new Date(iso).toLocaleString('en-KE', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    } catch {
      return iso.slice(0, 10)
    }
  }

  function decide(id: string, decision: 'Accepted' | 'Declined') {
    setLoanLenderDecision(id, decision, partner?.name ?? session.name)
  }

  const openStatuses: EnquiryStatus[] = ['New', 'Replied']

  return (
    <>
      <div className="admin-toolbar">
        <div>
          <h2>Loan applications</h2>
          <p style={{ margin: '0.2rem 0 0', color: '#64748b', fontSize: '0.85rem' }}>
            Buyers who requested {partner?.name ?? session.name} financing on Kenya Vehicles cars.
            Accepting notifies the selling yard.
          </p>
        </div>
        <div className="admin-toolbar-actions">
          <select value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
            <option value="All">All status</option>
            <option>New</option>
            <option>Replied</option>
            <option>Accepted</option>
            <option>Declined</option>
            <option>Closed</option>
          </select>
          <span className="admin-pill info">
            {rows.filter((r) => r.status === 'New').length} new
          </span>
          <span className="admin-pill ok">
            {rows.filter((r) => r.status === 'Accepted').length} accepted
          </span>
        </div>
      </div>

      <section className="admin-panel">
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Buyer</th>
                <th>Vehicle / yard</th>
                <th>Finance ask</th>
                <th>Created</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <tr key={row.id}>
                  <td>
                    <strong>{row.customerName}</strong>
                    <div style={{ color: '#64748b', fontSize: '0.8rem' }}>{row.customerPhone}</div>
                  </td>
                  <td>
                    {row.carId ? (
                      <Link to={`/cars/${row.carId}`}>{row.carLabel}</Link>
                    ) : (
                      row.carLabel
                    )}
                    <div style={{ color: '#64748b', fontSize: '0.8rem' }}>
                      Yard: {row.dealerName}
                      {row.carPrice != null ? ` · ${formatKES(row.carPrice)}` : ''}
                    </div>
                  </td>
                  <td>
                    {row.depositPercent != null && row.termMonths != null ? (
                      <>
                        {row.depositPercent}% deposit · {row.termMonths} mo
                        {row.estimatedMonthly != null && (
                          <div style={{ color: '#64748b', fontSize: '0.8rem' }}>
                            ~{formatKES(Math.round(row.estimatedMonthly))}/mo
                          </div>
                        )}
                      </>
                    ) : (
                      row.message
                    )}
                  </td>
                  <td className="mono">{formatWhen(row.createdAt)}</td>
                  <td>
                    <span className={`admin-pill ${statusClass(row.status)}`}>{row.status}</span>
                    {row.lenderDecisionAt && (
                      <div style={{ color: '#64748b', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                        {formatWhen(row.lenderDecisionAt)}
                      </div>
                    )}
                  </td>
                  <td>
                    <div className="admin-row-actions">
                      {openStatuses.includes(row.status) && (
                        <>
                          {row.status === 'New' && (
                            <button
                              type="button"
                              onClick={() => updateEnquiryStatus(row.id, 'Replied')}
                            >
                              Mark contacted
                            </button>
                          )}
                          <button type="button" onClick={() => decide(row.id, 'Accepted')}>
                            Accept loan
                          </button>
                          <button type="button" onClick={() => decide(row.id, 'Declined')}>
                            Decline
                          </button>
                        </>
                      )}
                      {row.status !== 'Closed' &&
                        row.status !== 'Accepted' &&
                        row.status !== 'Declined' && (
                          <button
                            type="button"
                            onClick={() => updateEnquiryStatus(row.id, 'Closed')}
                          >
                            Close
                          </button>
                        )}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6}>
                    <div className="admin-empty">
                      No loan applications yet. When buyers request {session.name} on a car listing
                      or the loans page, they appear here.
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  )
}
