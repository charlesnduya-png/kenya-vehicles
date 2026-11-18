import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { VerifiedBadge } from '../components/VerifiedBadge'
import { getCarsByDealer } from '../data/cars'
import { dealers as seedDealers } from '../data/dealers'
import type { Dealer } from '../data/types'

export function AdminDealers() {
  const [q, setQ] = useState('')
  const [list, setList] = useState<Dealer[]>(() => seedDealers.map((d) => ({ ...d })))
  const [toast, setToast] = useState('')

  const filtered = useMemo(() => {
    return list.filter((d) => {
      const hay = `${d.name} ${d.city} ${d.specialty}`.toLowerCase()
      return !q || hay.includes(q.toLowerCase())
    })
  }, [q, list])

  function flash(message: string) {
    setToast(message)
    window.setTimeout(() => setToast(''), 2500)
  }

  function syncSeed(id: string, verified: boolean) {
    const seed = seedDealers.find((d) => d.id === id)
    if (seed) seed.verified = verified
  }

  function grantBadge(id: string) {
    setList((prev) => prev.map((d) => (d.id === id ? { ...d, verified: true } : d)))
    syncSeed(id, true)
    flash('Dealer verified badge granted')
  }

  function revokeBadge(id: string) {
    setList((prev) => prev.map((d) => (d.id === id ? { ...d, verified: false } : d)))
    syncSeed(id, false)
    flash('Dealer verified badge removed')
  }

  return (
    <>
      {toast && <div className="admin-toast">{toast}</div>}

      <div className="admin-toolbar">
        <div>
          <h2>Dealer network</h2>
          <p style={{ margin: '0.2rem 0 0', color: '#64748b', fontSize: '0.85rem' }}>
            Grant or remove verified badges, monitor stock, and manage partner health
          </p>
        </div>
        <div className="admin-toolbar-actions">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search dealers…" />
          <button type="button" className="admin-btn admin-btn-primary">
            Invite dealer
          </button>
        </div>
      </div>

      <section className="admin-panel">
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Dealer</th>
                <th>Location</th>
                <th>Specialty</th>
                <th>Listings</th>
                <th>Rating</th>
                <th>Years</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filtered.map((dealer) => (
                <tr key={dealer.id}>
                  <td>
                    <strong className="with-verified">
                      <span>{dealer.name}</span>
                      {dealer.verified && <VerifiedBadge title="Verified dealer" size={15} />}
                    </strong>
                    <div style={{ color: '#64748b', fontSize: '0.8rem' }}>{dealer.email}</div>
                  </td>
                  <td>
                    {dealer.city}, {dealer.county}
                  </td>
                  <td>{dealer.specialty}</td>
                  <td className="mono">
                    {getCarsByDealer(dealer.id).length} / {dealer.carsListed}
                  </td>
                  <td className="mono">
                    ★ {dealer.rating} · {dealer.reviewCount}
                  </td>
                  <td className="mono">{dealer.yearsActive}</td>
                  <td>
                    <span className={`admin-pill ${dealer.verified ? 'ok' : 'warn'}`}>
                      {dealer.verified ? 'Verified' : 'Pending'}
                    </span>
                  </td>
                  <td>
                    <div className="admin-row-actions">
                      <Link to={`/dealers/${dealer.id}`} target="_blank">
                        <button type="button">Open</button>
                      </Link>
                      {dealer.verified ? (
                        <button type="button" onClick={() => revokeBadge(dealer.id)}>
                          Remove badge
                        </button>
                      ) : (
                        <button type="button" onClick={() => grantBadge(dealer.id)}>
                          Grant badge
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8}>
                    <div className="admin-empty">No dealers match that search.</div>
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
