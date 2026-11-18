import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { VerifiedBadge } from '../components/VerifiedBadge'
import { formatKES, formatMileage, getCars, subscribeCars } from '../data/cars'
import { getDealer } from '../data/dealers'

export function AdminCars() {
  const [q, setQ] = useState('')
  const [city, setCity] = useState('All')
  const [stock, setStock] = useState(() => getCars())

  useEffect(() => subscribeCars(() => setStock(getCars())), [])

  const cities = useMemo(
    () => ['All', ...Array.from(new Set(stock.map((c) => c.city)))],
    [stock],
  )

  const filtered = useMemo(() => {
    return stock.filter((car) => {
      const dealer = getDealer(car.dealerId)
      const hay = `${car.make} ${car.model} ${dealer?.name ?? ''} ${car.city}`.toLowerCase()
      return (!q || hay.includes(q.toLowerCase())) && (city === 'All' || car.city === city)
    })
  }, [stock, q, city])

  return (
    <>
      <div className="admin-toolbar">
        <div>
          <h2>Car sales inventory</h2>
          <p style={{ margin: '0.2rem 0 0', color: '#64748b', fontSize: '0.85rem' }}>
            Track every dealer listing across Kenya Vehicles
          </p>
        </div>
        <div className="admin-toolbar-actions">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search make, model, dealer…"
          />
          <select value={city} onChange={(e) => setCity(e.target.value)}>
            {cities.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <span className="admin-btn admin-btn-ghost">{filtered.length} cars</span>
        </div>
      </div>

      <section className="admin-panel">
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Vehicle</th>
                <th>Dealer</th>
                <th>Location</th>
                <th>Condition</th>
                <th>Mileage</th>
                <th>Price</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filtered.map((car) => {
                const dealer = getDealer(car.dealerId)
                return (
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
                      <span className="with-verified">
                        <span>{dealer?.name}</span>
                        {dealer?.verified && <VerifiedBadge title="Verified dealer" size={14} />}
                      </span>
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
                )
              })}
            </tbody>
          </table>
        </div>
      </section>
    </>
  )
}
