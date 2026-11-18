import { useEffect, useMemo, useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import type { AuthSession } from '../data/auth'
import { formatKES } from '../data/cars'
import {
  getOffersForDealer,
  subscribeOffers,
  updateOfferStatus,
  type CarOffer,
  type OfferStatus,
} from '../data/offers'
import type { Dealer } from '../data/types'

type Ctx = { session: AuthSession; dealer?: Dealer }

export function DealerOffers() {
  const { session } = useOutletContext<Ctx>()
  const [items, setItems] = useState<CarOffer[]>(() =>
    session.dealerId ? getOffersForDealer(session.dealerId) : [],
  )
  const [status, setStatus] = useState<'All' | OfferStatus>('All')
  const [toast, setToast] = useState('')

  useEffect(() => {
    if (!session.dealerId) return
    return subscribeOffers(() => setItems(getOffersForDealer(session.dealerId!)))
  }, [session.dealerId])

  const filtered = useMemo(
    () => items.filter((o) => status === 'All' || o.status === status),
    [items, status],
  )

  function flash(message: string) {
    setToast(message)
    window.setTimeout(() => setToast(''), 2500)
  }

  function statusClass(s: OfferStatus) {
    if (s === 'New') return 'info'
    if (s === 'Accepted') return 'ok'
    if (s === 'Declined') return 'danger'
    return 'muted'
  }

  return (
    <>
      {toast && <div className="admin-toast">{toast}</div>}

      <div className="admin-toolbar">
        <div>
          <h2>Customer offers</h2>
          <p style={{ margin: '0.2rem 0 0', color: '#64748b', fontSize: '0.85rem' }}>
            Price offers shoppers sent on your Kenya Vehicles listings
          </p>
        </div>
        <div className="admin-toolbar-actions">
          <select value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
            <option value="All">All status</option>
            <option>New</option>
            <option>Accepted</option>
            <option>Declined</option>
            <option>Withdrawn</option>
          </select>
          <span className="admin-pill info">
            {items.filter((o) => o.status === 'New').length} new
          </span>
        </div>
      </div>

      <section className="admin-panel">
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Vehicle</th>
                <th>Offer</th>
                <th>Buyer</th>
                <th>Message</th>
                <th>Submitted</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filtered.map((offer) => {
                const pct = Math.round((offer.amount / offer.askingPrice) * 100)
                return (
                  <tr key={offer.id}>
                    <td>
                      <strong>{offer.carLabel}</strong>
                      <div style={{ color: '#64748b', fontSize: '0.8rem' }}>
                        Asking {formatKES(offer.askingPrice)}
                      </div>
                    </td>
                    <td className="mono">
                      <strong>{formatKES(offer.amount)}</strong>
                      <div style={{ color: '#64748b', fontSize: '0.8rem' }}>{pct}% of ask</div>
                    </td>
                    <td>
                      {offer.buyerName}
                      <div style={{ color: '#64748b', fontSize: '0.8rem' }}>{offer.buyerPhone}</div>
                      <div style={{ color: '#64748b', fontSize: '0.75rem' }}>{offer.buyerEmail}</div>
                    </td>
                    <td style={{ maxWidth: 220 }}>{offer.message || '—'}</td>
                    <td className="mono">{new Date(offer.createdAt).toLocaleString()}</td>
                    <td>
                      <span className={`admin-pill ${statusClass(offer.status)}`}>
                        {offer.status}
                      </span>
                    </td>
                    <td>
                      <div className="admin-row-actions">
                        <Link to={`/cars/${offer.carId}`} target="_blank">
                          <button type="button">View car</button>
                        </Link>
                        {offer.status === 'New' && (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                updateOfferStatus(offer.id, 'Accepted')
                                flash('Offer accepted')
                              }}
                            >
                              Accept
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                updateOfferStatus(offer.id, 'Declined')
                                flash('Offer declined')
                              }}
                            >
                              Decline
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7}>
                    <div className="admin-empty">No offers in this filter yet.</div>
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
