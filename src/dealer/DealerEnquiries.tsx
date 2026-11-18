import { useEffect, useMemo, useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import type { AuthSession } from '../data/auth'
import { formatKES } from '../data/cars'
import {
  getEnquiriesForDealer,
  subscribeEnquiries,
  updateEnquiryStatus,
  type EnquiryStatus,
  type EnquiryType,
  type YardEnquiry,
} from '../data/enquiries'
import { getLoanPartner } from '../data/loans'
import type { Dealer } from '../data/types'

type Ctx = { session: AuthSession; dealer?: Dealer }

export function DealerEnquiries() {
  const { session } = useOutletContext<Ctx>()
  const [status, setStatus] = useState<'All' | EnquiryStatus>('All')
  const [type, setType] = useState<'All' | EnquiryType>('All')
  const [rows, setRows] = useState<YardEnquiry[]>(() =>
    session.dealerId ? getEnquiriesForDealer(session.dealerId) : [],
  )

  useEffect(() => {
    if (!session.dealerId) return
    const refresh = () => setRows(getEnquiriesForDealer(session.dealerId!))
    refresh()
    return subscribeEnquiries(refresh)
  }, [session.dealerId])

  const filtered = useMemo(
    () =>
      rows.filter(
        (r) =>
          (status === 'All' || r.status === status) && (type === 'All' || r.type === type),
      ),
    [rows, status, type],
  )

  const acceptedLoans = rows.filter((r) => r.type === 'Loan' && r.status === 'Accepted').length

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

  return (
    <>
      <div className="admin-toolbar">
        <div>
          <h2>Buyer enquiries</h2>
          <p style={{ margin: '0.2rem 0 0', color: '#64748b', fontSize: '0.85rem' }}>
            Sale leads and loan purchase requests for {session.name}. Accepted loans from lenders
            show here too.
          </p>
        </div>
        <div className="admin-toolbar-actions">
          <select value={type} onChange={(e) => setType(e.target.value as typeof type)}>
            <option value="All">All types</option>
            <option>Car sale</option>
            <option>Loan</option>
          </select>
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
          {acceptedLoans > 0 && (
            <span className="admin-pill ok">{acceptedLoans} loan accepted</span>
          )}
        </div>
      </div>

      <section className="admin-panel">
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Type</th>
                <th>Vehicle</th>
                <th>Details</th>
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
                    {row.customerEmail && (
                      <div style={{ color: '#64748b', fontSize: '0.75rem' }}>{row.customerEmail}</div>
                    )}
                  </td>
                  <td>
                    <span className={`admin-pill ${row.type === 'Loan' ? 'warn' : 'muted'}`}>
                      {row.type === 'Loan' ? 'Loan purchase' : 'Car sale'}
                    </span>
                  </td>
                  <td>
                    {row.carId ? (
                      <Link to={`/cars/${row.carId}`}>{row.carLabel}</Link>
                    ) : (
                      row.carLabel
                    )}
                    {row.carPrice != null && (
                      <div style={{ color: '#64748b', fontSize: '0.8rem' }}>
                        {formatKES(row.carPrice)}
                      </div>
                    )}
                  </td>
                  <td style={{ maxWidth: 320 }}>
                    <div>{row.message}</div>
                    {row.type === 'Loan' && (
                      <div style={{ color: '#64748b', fontSize: '0.8rem', marginTop: '0.35rem' }}>
                        {row.loanPartnerName && <div>Partner: {row.loanPartnerName}</div>}
                        {row.depositPercent != null && row.termMonths != null && (
                          <div>
                            {row.depositPercent}% deposit · {row.termMonths} mo
                            {row.estimatedMonthly != null &&
                              ` · ~${formatKES(Math.round(row.estimatedMonthly))}/mo`}
                          </div>
                        )}
                        {(() => {
                          const agent = row.loanPartnerId
                            ? getLoanPartner(row.loanPartnerId)
                            : undefined
                          if (!agent) return null
                          return (
                            <div
                              style={{
                                marginTop: '0.45rem',
                                padding: '0.55rem 0.65rem',
                                borderRadius: 8,
                                background: '#f0f9ff',
                                border: '1px solid #bae6fd',
                                color: '#0c4a6e',
                              }}
                            >
                              <div style={{ fontWeight: 800, marginBottom: '0.2rem' }}>
                                Loan agent contact
                              </div>
                              {agent.contactName && <div>{agent.contactName}</div>}
                              <div style={{ marginTop: '0.35rem', display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
                                <a
                                  href={`tel:${agent.phone.replace(/\s/g, '')}`}
                                  className="admin-btn admin-btn-primary"
                                  style={{ textDecoration: 'none' }}
                                >
                                  Call {agent.phone}
                                </a>
                                <a
                                  href={`mailto:${agent.email}`}
                                  className="admin-btn admin-btn-ghost"
                                  style={{ textDecoration: 'none' }}
                                >
                                  Email {agent.email}
                                </a>
                              </div>
                            </div>
                          )
                        })()}
                        {row.status === 'Accepted' && (
                          <div
                            style={{
                              marginTop: '0.45rem',
                              padding: '0.45rem 0.55rem',
                              borderRadius: 6,
                              background: '#ecfdf5',
                              color: '#047857',
                              fontWeight: 700,
                              fontSize: '0.8rem',
                            }}
                          >
                            {(row.lenderDecisionBy ?? row.loanPartnerName ?? 'Loan partner')}{' '}
                            accepted this loan request
                            {row.lenderDecisionAt ? ` · ${formatWhen(row.lenderDecisionAt)}` : ''}
                          </div>
                        )}
                        {row.status === 'Declined' && (
                          <div
                            style={{
                              marginTop: '0.45rem',
                              padding: '0.45rem 0.55rem',
                              borderRadius: 6,
                              background: '#fef2f2',
                              color: '#b91c1c',
                              fontWeight: 700,
                              fontSize: '0.8rem',
                            }}
                          >
                            {(row.lenderDecisionBy ?? row.loanPartnerName ?? 'Loan partner')}{' '}
                            declined this loan request
                            {row.lenderDecisionAt ? ` · ${formatWhen(row.lenderDecisionAt)}` : ''}
                          </div>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="mono">{formatWhen(row.createdAt)}</td>
                  <td>
                    <span className={`admin-pill ${statusClass(row.status)}`}>{row.status}</span>
                  </td>
                  <td>
                    <div className="admin-row-actions">
                      {row.status === 'New' && (
                        <button type="button" onClick={() => updateEnquiryStatus(row.id, 'Replied')}>
                          Mark replied
                        </button>
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
                  <td colSpan={7}>
                    <div className="admin-empty">
                      No enquiries yet. When buyers enquire or request a loan on your cars, they
                      show up here. Lender accept decisions appear on loan rows.
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
