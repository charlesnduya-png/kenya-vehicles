import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { formatKES } from '../data/cars'
import { getDealer } from '../data/dealers'
import { getRentals, subscribeRentals } from '../data/rentals'

export function AdminRentals() {
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('All')
  const [fleet, setFleet] = useState(() => getRentals())

  useEffect(() => subscribeRentals(() => setFleet(getRentals())), [])

  const filtered = useMemo(() => {
    return fleet.filter((car) => {
      const dealer = getDealer(car.dealerId)
      const hay = `${car.make} ${car.model} ${dealer?.name ?? ''} ${car.city}`.toLowerCase()
      const matchesQ = !q || hay.includes(q.toLowerCase())
      const matchesStatus =
        status === 'All' ||
        (status === 'Available' && car.available) ||
        (status === 'Booked' && !car.available)
      return matchesQ && matchesStatus
    })
  }, [fleet, q, status])

  return (
    <>
      <div className="admin-toolbar">
        <div>
          <h2>Car rental fleet</h2>
          <p style={{ margin: '0.2rem 0 0', color: '#64748b', fontSize: '0.85rem' }}>
            Hire cars listed by dealers on Kenya Vehicles
          </p>
        </div>
        <div className="admin-toolbar-actions">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search hire cars…"
          />
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option>All</option>
            <option>Available</option>
            <option>Booked</option>
          </select>
          <span className="admin-btn admin-btn-ghost">{filtered.length} rentals</span>
        </div>
      </div>

      <section className="admin-panel">
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Vehicle</th>
                <th>Dealer</th>
                <th>City</th>
                <th>Daily</th>
                <th>Weekly</th>
                <th>Deposit</th>
                <th>Options</th>
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
                        {car.seats} seats · {car.transmission}
                      </div>
                    </td>
                    <td>
                      {dealer ? (
                        <Link to={`/dealers/${dealer.id}`} target="_blank">
                          {dealer.name}
                        </Link>
                      ) : (
                        car.dealerId
                      )}
                    </td>
                    <td>{car.city}</td>
                    <td className="mono">{formatKES(car.pricePerDay)}</td>
                    <td className="mono">{formatKES(car.pricePerWeek)}</td>
                    <td className="mono">{formatKES(car.deposit)}</td>
                    <td>
                      {car.selfDrive ? 'Self-drive' : ''}
                      {car.selfDrive && car.withDriver ? ' · ' : ''}
                      {car.withDriver ? 'Driver' : ''}
                    </td>
                    <td>
                      <span className={`admin-pill ${car.available ? 'ok' : 'danger'}`}>
                        {car.available ? 'Available' : 'Booked'}
                      </span>
                    </td>
                    <td>
                      <div className="admin-row-actions">
                        <Link to={`/rentals/${car.id}`} target="_blank">
                          <button type="button">View</button>
                        </Link>
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
