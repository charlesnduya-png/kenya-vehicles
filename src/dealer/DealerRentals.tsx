import { type FormEvent, useEffect, useMemo, useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import type { AuthSession } from '../data/auth'
import { formatKES } from '../data/cars'
import {
  addRental,
  getRentalsByDealer,
  setRentalAvailable,
  subscribeRentals,
} from '../data/rentals'
import type { BodyType, Dealer } from '../data/types'

type Ctx = { session: AuthSession; dealer?: Dealer }

const bodies: BodyType[] = ['SUV', 'Sedan', 'Hatchback', 'Pickup', 'Van']

export function DealerRentals() {
  const { session, dealer } = useOutletContext<Ctx>()
  const dealerId = session.dealerId ?? ''
  const [q, setQ] = useState('')
  const [rows, setRows] = useState(() => (dealerId ? getRentalsByDealer(dealerId) : []))
  const [showForm, setShowForm] = useState(false)
  const [toast, setToast] = useState('')

  const [make, setMake] = useState('Toyota')
  const [model, setModel] = useState('')
  const [year, setYear] = useState(2018)
  const [pricePerDay, setPricePerDay] = useState(5000)
  const [pricePerWeek, setPricePerWeek] = useState(30000)
  const [deposit, setDeposit] = useState(25000)
  const [transmission, setTransmission] = useState<'Automatic' | 'Manual'>('Automatic')
  const [fuel, setFuel] = useState<'Petrol' | 'Diesel' | 'Hybrid' | 'Electric'>('Petrol')
  const [bodyType, setBodyType] = useState<BodyType>('Sedan')
  const [seats, setSeats] = useState(5)
  const [selfDrive, setSelfDrive] = useState(true)
  const [withDriver, setWithDriver] = useState(true)
  const [description, setDescription] = useState('')

  useEffect(() => {
    if (!dealerId) return
    const refresh = () => setRows(getRentalsByDealer(dealerId))
    refresh()
    return subscribeRentals(refresh)
  }, [dealerId])

  const filtered = useMemo(() => {
    return rows.filter((car) => {
      const hay = `${car.make} ${car.model} ${car.bodyType} ${car.city}`.toLowerCase()
      return !q || hay.includes(q.toLowerCase())
    })
  }, [rows, q])

  function flash(message: string) {
    setToast(message)
    window.setTimeout(() => setToast(''), 2600)
  }

  function onAdd(e: FormEvent) {
    e.preventDefault()
    if (!dealerId || !model.trim()) return
    addRental({
      dealerId,
      make,
      model,
      year,
      pricePerDay,
      pricePerWeek,
      deposit,
      transmission,
      fuel,
      bodyType,
      seats,
      city: dealer?.city ?? session.city,
      county: dealer?.county ?? dealer?.city ?? session.city,
      withDriver,
      selfDrive,
      description:
        description.trim() ||
        `${year} ${make} ${model} for hire from ${dealer?.name ?? session.name}.`,
    })
    setModel('')
    setDescription('')
    setShowForm(false)
    flash('Hire car listed on Kenya Vehicles')
  }

  return (
    <>
      {toast && <div className="admin-toast">{toast}</div>}

      <div className="admin-toolbar">
        <div>
          <h2>Your rental fleet</h2>
          <p style={{ margin: '0.2rem 0 0', color: '#64748b', fontSize: '0.85rem' }}>
            Dealers list hire cars — buyers book them on Car Rental
          </p>
        </div>
        <div className="admin-toolbar-actions">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search hire cars…"
          />
          <button
            type="button"
            className="admin-btn admin-btn-primary"
            onClick={() => setShowForm((v) => !v)}
          >
            {showForm ? 'Close form' : 'List hire car'}
          </button>
          <span className="admin-btn admin-btn-ghost">{filtered.length} rentals</span>
        </div>
      </div>

      {showForm && (
        <section className="admin-panel" style={{ marginBottom: '1rem' }}>
          <div className="admin-panel-head">
            <div>
              <h2>New hire listing</h2>
              <p>Appears on the public Car Rental page under your yard</p>
            </div>
          </div>
          <form onSubmit={onAdd} style={{ padding: '0 1.2rem 1.2rem' }} className="admin-content">
            <div className="grid-2">
              <div className="field">
                <label htmlFor="r-make">Make</label>
                <input id="r-make" required value={make} onChange={(e) => setMake(e.target.value)} />
              </div>
              <div className="field">
                <label htmlFor="r-model">Model</label>
                <input
                  id="r-model"
                  required
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="Axio"
                />
              </div>
              <div className="field">
                <label htmlFor="r-year">Year</label>
                <input
                  id="r-year"
                  type="number"
                  min={1990}
                  max={2030}
                  required
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value) || year)}
                />
              </div>
              <div className="field">
                <label htmlFor="r-body">Body</label>
                <select
                  id="r-body"
                  value={bodyType}
                  onChange={(e) => setBodyType(e.target.value as BodyType)}
                >
                  {bodies.map((b) => (
                    <option key={b}>{b}</option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="r-day">Price / day (KES)</label>
                <input
                  id="r-day"
                  type="number"
                  min={500}
                  required
                  value={pricePerDay}
                  onChange={(e) => setPricePerDay(Number(e.target.value) || 0)}
                />
              </div>
              <div className="field">
                <label htmlFor="r-week">Price / week (KES)</label>
                <input
                  id="r-week"
                  type="number"
                  min={1000}
                  required
                  value={pricePerWeek}
                  onChange={(e) => setPricePerWeek(Number(e.target.value) || 0)}
                />
              </div>
              <div className="field">
                <label htmlFor="r-deposit">Deposit (KES)</label>
                <input
                  id="r-deposit"
                  type="number"
                  min={0}
                  required
                  value={deposit}
                  onChange={(e) => setDeposit(Number(e.target.value) || 0)}
                />
              </div>
              <div className="field">
                <label htmlFor="r-seats">Seats</label>
                <input
                  id="r-seats"
                  type="number"
                  min={2}
                  max={30}
                  required
                  value={seats}
                  onChange={(e) => setSeats(Number(e.target.value) || 5)}
                />
              </div>
              <div className="field">
                <label htmlFor="r-trans">Transmission</label>
                <select
                  id="r-trans"
                  value={transmission}
                  onChange={(e) => setTransmission(e.target.value as 'Automatic' | 'Manual')}
                >
                  <option>Automatic</option>
                  <option>Manual</option>
                </select>
              </div>
              <div className="field">
                <label htmlFor="r-fuel">Fuel</label>
                <select
                  id="r-fuel"
                  value={fuel}
                  onChange={(e) =>
                    setFuel(e.target.value as 'Petrol' | 'Diesel' | 'Hybrid' | 'Electric')
                  }
                >
                  <option>Petrol</option>
                  <option>Diesel</option>
                  <option>Hybrid</option>
                  <option>Electric</option>
                </select>
              </div>
            </div>

            <div className="field" style={{ marginTop: '0.85rem' }}>
              <label htmlFor="r-desc">Description</label>
              <textarea
                id="r-desc"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Who this hire car is best for…"
              />
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '0.85rem' }}>
              <label className="check-row">
                <input
                  type="checkbox"
                  checked={selfDrive}
                  onChange={(e) => setSelfDrive(e.target.checked)}
                />
                Self-drive
              </label>
              <label className="check-row">
                <input
                  type="checkbox"
                  checked={withDriver}
                  onChange={(e) => setWithDriver(e.target.checked)}
                />
                With driver
              </label>
            </div>

            <button type="submit" className="admin-btn admin-btn-primary" style={{ marginTop: '1rem' }}>
              Publish hire listing
            </button>
          </form>
        </section>
      )}

      <section className="admin-panel">
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Vehicle</th>
                <th>Daily</th>
                <th>Weekly</th>
                <th>Deposit</th>
                <th>Options</th>
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
                      {car.bodyType} · {car.seats} seats · {car.city}
                    </div>
                  </td>
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
                      <button
                        type="button"
                        onClick={() => {
                          setRentalAvailable(car.id, !car.available)
                          flash(car.available ? 'Marked booked' : 'Marked available')
                        }}
                      >
                        {car.available ? 'Mark booked' : 'Mark available'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7}>
                    <div className="admin-empty">
                      No hire cars yet. List one to show on the Car Rental marketplace.
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
