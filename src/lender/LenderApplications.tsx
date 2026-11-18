import { useEffect, useMemo, useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import type { AuthSession } from '../data/auth'
import { formatKES, formatMileage, getCar } from '../data/cars'
import {
  getEnquiriesForLoanPartner,
  setLoanLenderDecision,
  subscribeEnquiries,
  updateEnquiryStatus,
  type EnquiryStatus,
  type YardEnquiry,
} from '../data/enquiries'
import type { LoanPartner } from '../data/types'
import './LenderApplications.css'

type Ctx = { session: AuthSession; partner?: LoanPartner }

export function LenderApplications() {
  const { session, partner } = useOutletContext<Ctx>()
  const [status, setStatus] = useState<'All' | EnquiryStatus>('All')
  const [rows, setRows] = useState<YardEnquiry[]>(() =>
    session.loanPartnerId ? getEnquiriesForLoanPartner(session.loanPartnerId) : [],
  )
  const [selectedId, setSelectedId] = useState<string>('')

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

  const selected =
    filtered.find((r) => r.id === selectedId) ?? filtered[0] ?? rows.find((r) => r.id === selectedId) ?? null

  useEffect(() => {
    if (!selectedId && filtered[0]) setSelectedId(filtered[0].id)
    if (selectedId && filtered.length && !filtered.some((r) => r.id === selectedId)) {
      setSelectedId(filtered[0]?.id ?? '')
    }
  }, [filtered, selectedId])

  const liveCar = selected?.carId ? getCar(selected.carId) : undefined

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

  const unitImage = selected?.carImage ?? liveCar?.images[0]
  const unitYear = selected?.carYear ?? liveCar?.year
  const unitMake = selected?.carMake ?? liveCar?.make
  const unitModel = selected?.carModel ?? liveCar?.model
  const unitMileage = selected?.carMileage ?? liveCar?.mileage
  const unitCity = selected?.carCity ?? liveCar?.city
  const unitPrice = selected?.carPrice ?? liveCar?.price
  const unitTitle =
    unitYear && unitMake && unitModel
      ? `${unitYear} ${unitMake} ${unitModel}`
      : selected?.carLabel ?? 'Vehicle'

  return (
    <>
      <div className="admin-toolbar">
        <div>
          <h2>Loan applications</h2>
          <p style={{ margin: '0.2rem 0 0', color: '#64748b', fontSize: '0.85rem' }}>
            See the exact unit the buyer inquired about, then accept or decline financing.
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

      <div className="lender-apps-layout">
        <section className="admin-panel lender-apps-list">
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Buyer</th>
                  <th>Unit inquired</th>
                  <th>Finance ask</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => (
                  <tr
                    key={row.id}
                    className={selected?.id === row.id ? 'is-selected' : undefined}
                    onClick={() => setSelectedId(row.id)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td>
                      <strong>{row.customerName}</strong>
                      <div style={{ color: '#64748b', fontSize: '0.8rem' }}>{row.customerPhone}</div>
                    </td>
                    <td>
                      <strong>{row.carLabel}</strong>
                      <div style={{ color: '#64748b', fontSize: '0.8rem' }}>
                        {row.dealerName}
                        {row.carPrice != null ? ` · ${formatKES(row.carPrice)}` : ''}
                      </div>
                    </td>
                    <td>
                      {row.depositPercent != null && row.termMonths != null ? (
                        <>
                          {row.depositPercent}% · {row.termMonths} mo
                          {row.estimatedMonthly != null && (
                            <div style={{ color: '#64748b', fontSize: '0.8rem' }}>
                              ~{formatKES(Math.round(row.estimatedMonthly))}/mo
                            </div>
                          )}
                        </>
                      ) : (
                        <span style={{ color: '#64748b', fontSize: '0.85rem' }}>{row.message}</span>
                      )}
                    </td>
                    <td>
                      <span className={`admin-pill ${statusClass(row.status)}`}>{row.status}</span>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={4}>
                      <div className="admin-empty">
                        No loan applications yet. When buyers request {session.name} on a car
                        listing, the unit appears here.
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="admin-panel lender-unit-panel">
          {!selected ? (
            <div className="admin-empty" style={{ padding: '1.5rem' }}>
              Select an application to view the customer&apos;s unit.
            </div>
          ) : (
            <>
              <div className="admin-panel-head">
                <div>
                  <h2>Unit inquired</h2>
                  <p>
                    {selected.customerName} · {formatWhen(selected.createdAt)}
                  </p>
                </div>
                <span className={`admin-pill ${statusClass(selected.status)}`}>
                  {selected.status}
                </span>
              </div>

              <div className="lender-unit-body">
                {unitImage ? (
                  <img src={unitImage} alt={unitTitle} className="lender-unit-photo" />
                ) : (
                  <div className="lender-unit-photo lender-unit-photo-empty">No photo</div>
                )}

                <div className="lender-unit-copy">
                  <h3>{unitTitle}</h3>
                  <p className="lender-unit-price">
                    {unitPrice != null ? formatKES(unitPrice) : 'Price on listing'}
                  </p>
                  <dl className="lender-unit-specs">
                    {unitMileage != null && (
                      <div>
                        <dt>Mileage</dt>
                        <dd>{formatMileage(unitMileage)}</dd>
                      </div>
                    )}
                    {unitCity && (
                      <div>
                        <dt>City</dt>
                        <dd>{unitCity}</dd>
                      </div>
                    )}
                    <div>
                      <dt>Selling yard</dt>
                      <dd>{selected.dealerName}</dd>
                    </div>
                    {liveCar && (
                      <>
                        <div>
                          <dt>Body</dt>
                          <dd>{liveCar.bodyType}</dd>
                        </div>
                        <div>
                          <dt>Transmission</dt>
                          <dd>{liveCar.transmission}</dd>
                        </div>
                        <div>
                          <dt>Fuel</dt>
                          <dd>{liveCar.fuel}</dd>
                        </div>
                        <div>
                          <dt>Condition</dt>
                          <dd>{liveCar.condition}</dd>
                        </div>
                      </>
                    )}
                  </dl>

                  <p className="lender-unit-msg">{selected.message}</p>

                  {(selected.depositPercent != null || selected.estimatedMonthly != null) && (
                    <p className="lender-unit-finance">
                      Buyer ask:{' '}
                      {selected.depositPercent != null ? `${selected.depositPercent}% deposit` : ''}
                      {selected.termMonths != null ? ` · ${selected.termMonths} months` : ''}
                      {selected.estimatedMonthly != null
                        ? ` · ~${formatKES(Math.round(selected.estimatedMonthly))}/mo`
                        : ''}
                    </p>
                  )}

                  <div className="lender-unit-actions">
                    {selected.carId && (
                      <Link
                        to={`/cars/${selected.carId}`}
                        className="admin-btn admin-btn-primary"
                        target="_blank"
                        rel="noreferrer"
                      >
                        Open unit listing
                      </Link>
                    )}
                    <Link
                      to={`/dealers/${selected.dealerId}`}
                      className="admin-btn admin-btn-ghost"
                      target="_blank"
                      rel="noreferrer"
                    >
                      View yard
                    </Link>
                  </div>

                  <div className="admin-row-actions" style={{ marginTop: '0.85rem' }}>
                    {openStatuses.includes(selected.status) && (
                      <>
                        {selected.status === 'New' && (
                          <button
                            type="button"
                            onClick={() => updateEnquiryStatus(selected.id, 'Replied')}
                          >
                            Mark contacted
                          </button>
                        )}
                        <button type="button" onClick={() => decide(selected.id, 'Accepted')}>
                          Accept loan
                        </button>
                        <button type="button" onClick={() => decide(selected.id, 'Declined')}>
                          Decline
                        </button>
                      </>
                    )}
                    {selected.status !== 'Closed' &&
                      selected.status !== 'Accepted' &&
                      selected.status !== 'Declined' && (
                        <button
                          type="button"
                          onClick={() => updateEnquiryStatus(selected.id, 'Closed')}
                        >
                          Close
                        </button>
                      )}
                  </div>
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </>
  )
}
