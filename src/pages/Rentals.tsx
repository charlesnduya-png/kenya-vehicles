import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { RentalCard } from '../components/RentalCard'
import { rentalCars } from '../data/rentals'
import type { BodyType } from '../data/types'
import './Browse.css'
import './Rentals.css'

const bodyTypes: Array<BodyType | 'All'> = [
  'All',
  'SUV',
  'Sedan',
  'Hatchback',
  'Pickup',
  'Van',
]

const cities = ['All', 'Nairobi', 'Mombasa', 'Nakuru']

export function Rentals() {
  const [q, setQ] = useState('')
  const [city, setCity] = useState('All')
  const [bodyType, setBodyType] = useState<BodyType | 'All'>('All')
  const [drive, setDrive] = useState<'All' | 'Self-drive' | 'With driver'>('All')
  const [availableOnly, setAvailableOnly] = useState(true)

  const filtered = useMemo(() => {
    return rentalCars.filter((car) => {
      const hay = `${car.make} ${car.model} ${car.city}`.toLowerCase()
      const matchesQ = !q || hay.includes(q.toLowerCase())
      const matchesCity = city === 'All' || car.city === city
      const matchesBody = bodyType === 'All' || car.bodyType === bodyType
      const matchesDrive =
        drive === 'All' ||
        (drive === 'Self-drive' && car.selfDrive) ||
        (drive === 'With driver' && car.withDriver)
      const matchesAvail = !availableOnly || car.available
      return matchesQ && matchesCity && matchesBody && matchesDrive && matchesAvail
    })
  }, [q, city, bodyType, drive, availableOnly])

  return (
    <section className="section browse rentals-page">
      <div className="container">
        <nav className="amz-crumb">
          <Link to="/">Kenya Vehicles</Link>
          <span>›</span>
          <span>Car rental</span>
        </nav>

        <div className="rentals-intro panel-card">
          <div>
            <h1>Hire a car in Kenya</h1>
            <p>
              Browse cars from verified rental partners — self-drive or with a driver. Book daily
              or weekly from Nairobi, Mombasa, Nakuru and more.
            </p>
          </div>
          <Link to="/join#rentals" className="btn btn-primary">
            List your rental car
          </Link>
        </div>

        <div className="browse-layout">
          <aside className="browse-filters panel-card">
            <h2>Filters</h2>
            <div className="field">
              <label htmlFor="rq">Search</label>
              <input
                id="rq"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Toyota, Hilux…"
              />
            </div>
            <div className="field">
              <label htmlFor="rcity">City</label>
              <select id="rcity" value={city} onChange={(e) => setCity(e.target.value)}>
                {cities.map((c) => (
                  <option key={c} value={c}>
                    {c === 'All' ? 'All cities' : c}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="rbody">Body type</label>
              <select
                id="rbody"
                value={bodyType}
                onChange={(e) => setBodyType(e.target.value as BodyType | 'All')}
              >
                {bodyTypes.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="rdrive">Drive option</label>
              <select
                id="rdrive"
                value={drive}
                onChange={(e) => setDrive(e.target.value as typeof drive)}
              >
                <option>All</option>
                <option>Self-drive</option>
                <option>With driver</option>
              </select>
            </div>
            <label className="check-row">
              <input
                type="checkbox"
                checked={availableOnly}
                onChange={(e) => setAvailableOnly(e.target.checked)}
              />
              Available now only
            </label>
          </aside>

          <div className="browse-results">
            <div className="browse-toolbar panel-card">
              <div>
                <h1>{filtered.length} rental cars</h1>
                <p>Daily &amp; weekly hire from Kenya Vehicles partners</p>
              </div>
            </div>

            {filtered.length === 0 ? (
              <div className="browse-empty panel-card">
                <h3>No rentals match</h3>
                <p>Try another city or turn off “Available now”.</p>
              </div>
            ) : (
              <div className="grid-cars">
                {filtered.map((rental) => (
                  <RentalCard key={rental.id} rental={rental} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
