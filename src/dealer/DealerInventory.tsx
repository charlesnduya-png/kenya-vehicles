import { useMemo, useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import type { AuthSession } from '../data/auth'
import { formatKES, formatMileage, getCarsByDealer } from '../data/cars'
import type { Dealer } from '../data/types'

type Ctx = { session: AuthSession; dealer?: Dealer }

export function DealerInventory() {
  const { session } = useOutletContext<Ctx>()
  const [q, setQ] = useState('')
  const stock = useMemo(
    () => (session.dealerId ? getCarsByDealer(session.dealerId) : []),
    [session.dealerId],
  )

  const filtered = useMemo(() => {
    return stock.filter((car) => {
      const hay = `${car.make} ${car.model} ${car.bodyType} ${car.city}`.toLowerCase()
      return !q || hay.includes(q.toLowerCase())
    })
  }, [stock, q])

  return (
    <>
      <div className="admin-toolbar">
        <div>
          <h2>Your car listings</h2>
          <p style={{ margin: '0.2rem 0 0', color: '#64748b', fontSize: '0.85rem' }}>
            Stock live on Kenya Vehicles under {session.name}
          </p>
        </div>
        <div className="admin-toolbar-actions">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search make, model…"
          />
          <button type="button" className="admin-btn admin-btn-primary">
            Add listing
          </button>
          <span className="admin-btn admin-btn-ghost">{filtered.length} cars</span>
        </div>
      </div>

      <section className="admin-panel">
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Vehicle</th>
                <th>Location</th>
                <th>Condition</th>
                <th>Mileage</th>
                <th>Price</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filtered.map((car) => (
                <tr key={car.id}>
                  <td>
                    <strong>
                      {car.year} {car.make} {car.model}
                    </strong>
                    <div style={{ color: '#64748b', fontSize: '0.8rem' }}>
                      {car.id.toUpperCase()} · {car.bodyType} · {car.transmission}
                    </div>
                  </td>
                  <td>
                    {car.city}, {car.county}
                  </td>
                  <td>{car.condition}</td>
                  <td className="mono">{formatMileage(car.mileage)}</td>
                  <td className="mono">{formatKES(car.price)}</td>
                  <td>
                    <span className={`admin-pill ${car.featured ? 'ok' : 'muted'}`}>
                      {car.featured ? 'Featured' : 'Live'}
                    </span>
                  </td>
                  <td>
                    <div className="admin-row-actions">
                      <Link to={`/cars/${car.id}`} target="_blank">
                        <button type="button">View</button>
                      </Link>
                      <button type="button">Edit</button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7}>
                    <div className="admin-empty">No listings match that search.</div>
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
