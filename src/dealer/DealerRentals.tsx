import { type FormEvent, useEffect, useMemo, useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import type { AuthSession } from '../data/auth'
import { formatKES } from '../data/cars'
import { subscribeBilling } from '../data/billing'
import { dealerCanListInventory } from '../data/dealerAccess'
import { subscribePlatformSettings } from '../data/platformSettings'
import {
  addRental,
  getRentalsByDealer,
  setRentalAvailable,
  subscribeRentals,
  updateRental,
} from '../data/rentals'
import type { BodyType, Dealer, RentalCar } from '../data/types'
import { ListingImageUploader } from './ListingImageUploader'

type Ctx = { session: AuthSession; dealer?: Dealer }

const bodies: BodyType[] = ['SUV', 'Sedan', 'Hatchback', 'Pickup', 'Van']

type Draft = {
  make: string
  model: string
  year: number
  pricePerDay: number
  pricePerWeek: number
  deposit: number
  transmission: RentalCar['transmission']
  fuel: RentalCar['fuel']
  bodyType: BodyType
  seats: number
  city: string
  county: string
  selfDrive: boolean
  withDriver: boolean
  featured: boolean
  available: boolean
  description: string
  includesText: string
  images: string[]
}

function draftFromRental(car: RentalCar): Draft {
  return {
    make: car.make,
    model: car.model,
    year: car.year,
    pricePerDay: car.pricePerDay,
    pricePerWeek: car.pricePerWeek,
    deposit: car.deposit,
    transmission: car.transmission,
    fuel: car.fuel,
    bodyType: car.bodyType,
    seats: car.seats,
    city: car.city,
    county: car.county,
    selfDrive: car.selfDrive,
    withDriver: car.withDriver,
    featured: car.featured,
    available: car.available,
    description: car.description,
    includesText: car.includes.join(', '),
    images: [...car.images],
  }
}

function emptyDraft(dealer?: Dealer, cityFallback = 'Nairobi'): Draft {
  return {
    make: 'Toyota',
    model: '',
    year: 2018,
    pricePerDay: 5000,
    pricePerWeek: 30000,
    deposit: 25000,
    transmission: 'Automatic',
    fuel: 'Petrol',
    bodyType: 'Sedan',
    seats: 5,
    city: dealer?.city ?? cityFallback,
    county: dealer?.county ?? dealer?.city ?? cityFallback,
    selfDrive: true,
    withDriver: true,
    featured: false,
    available: true,
    description: '',
    includesText: 'Comprehensive insurance, Kenya Vehicles booking',
    images: [],
  }
}

export function DealerRentals() {
  const { session, dealer } = useOutletContext<Ctx>()
  const dealerId = session.dealerId ?? ''
  const [q, setQ] = useState('')
  const [rows, setRows] = useState(() => (dealerId ? getRentalsByDealer(dealerId) : []))
  const [mode, setMode] = useState<'closed' | 'add' | 'edit'>('closed')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState<Draft>(() => emptyDraft(dealer, session.city))
  const [toast, setToast] = useState('')
  const [listAccess, setListAccess] = useState(() => dealerCanListInventory(session.accountId))

  useEffect(() => {
    if (!dealerId) return
    const refresh = () => setRows(getRentalsByDealer(dealerId))
    refresh()
    return subscribeRentals(refresh)
  }, [dealerId])

  useEffect(() => {
    const refresh = () => setListAccess(dealerCanListInventory(session.accountId))
    refresh()
    const offPay = subscribePlatformSettings(refresh)
    const offBill = subscribeBilling(refresh)
    return () => {
      offPay()
      offBill()
    }
  }, [session.accountId])

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

  function openAdd() {
    const access = dealerCanListInventory(session.accountId)
    setListAccess(access)
    if (!access.allowed) {
      flash(access.message)
      return
    }
    setMode('add')
    setEditingId(null)
    setDraft(emptyDraft(dealer, session.city))
  }

  function openEdit(car: RentalCar) {
    setMode('edit')
    setEditingId(car.id)
    setDraft(draftFromRental(car))
  }

  function closeForm() {
    setMode('closed')
    setEditingId(null)
  }

  function patchDraft<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((d) => ({ ...d, [key]: value }))
  }

  function onSave(e: FormEvent) {
    e.preventDefault()
    if (!dealerId || !draft.model.trim()) return
    if (mode === 'add') {
      const access = dealerCanListInventory(session.accountId)
      setListAccess(access)
      if (!access.allowed) {
        flash(access.message)
        return
      }
    }
    const includes = draft.includesText
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
    const images = draft.images.length
      ? draft.images
      : [
          'https://upload.wikimedia.org/wikipedia/commons/5/55/2016_Toyota_Corolla_Axio_Hybrid_sedan_front.jpg',
        ]

    if (mode === 'edit' && editingId) {
      updateRental(editingId, dealerId, {
        make: draft.make,
        model: draft.model,
        year: draft.year,
        pricePerDay: draft.pricePerDay,
        pricePerWeek: draft.pricePerWeek,
        deposit: draft.deposit,
        transmission: draft.transmission,
        fuel: draft.fuel,
        bodyType: draft.bodyType,
        seats: draft.seats,
        city: draft.city,
        county: draft.county,
        selfDrive: draft.selfDrive,
        withDriver: draft.withDriver,
        featured: draft.featured,
        available: draft.available,
        description: draft.description,
        includes,
        images,
      })
      flash('Hire listing updated')
    } else {
      addRental({
        dealerId,
        make: draft.make,
        model: draft.model,
        year: draft.year,
        pricePerDay: draft.pricePerDay,
        pricePerWeek: draft.pricePerWeek,
        deposit: draft.deposit,
        transmission: draft.transmission,
        fuel: draft.fuel,
        bodyType: draft.bodyType,
        seats: draft.seats,
        city: draft.city,
        county: draft.county,
        withDriver: draft.withDriver,
        selfDrive: draft.selfDrive,
        featured: draft.featured,
        available: draft.available,
        description:
          draft.description.trim() ||
          `${draft.year} ${draft.make} ${draft.model} for hire from ${dealer?.name ?? session.name}.`,
        includes,
        images,
      })
      flash('Hire car listed on Kenya Vehicles')
    }
    closeForm()
  }

  return (
    <>
      {toast && <div className="admin-toast">{toast}</div>}

      <div className="admin-toolbar">
        <div>
          <h2>Your rental fleet</h2>
          <p style={{ margin: '0.2rem 0 0', color: '#64748b', fontSize: '0.85rem' }}>
            Add and edit hire cars — buyers book them on Car Rental
            {listAccess.allowed ? ' · Unlimited listings' : ' · Payment required to add listings'}
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
            onClick={() => (mode === 'add' ? closeForm() : openAdd())}
            disabled={mode !== 'add' && !listAccess.allowed}
          >
            {mode === 'add' ? 'Close form' : 'Add listing'}
          </button>
          <span className="admin-btn admin-btn-ghost">{filtered.length} rentals</span>
        </div>
      </div>

      {!listAccess.allowed && (
        <section className="admin-panel" style={{ marginBottom: '1rem' }}>
          <div className="admin-panel-head">
            <div>
              <h2>Subscription required</h2>
              <p>{listAccess.message}</p>
            </div>
            <Link to="/dealer/subscription" className="admin-btn admin-btn-primary">
              Pay KES 2,000/month to post
            </Link>
          </div>
        </section>
      )}

      {mode !== 'closed' && (
        <section className="admin-panel" style={{ marginBottom: '1rem' }}>
          <div className="admin-panel-head">
            <div>
              <h2>{mode === 'edit' ? 'Edit hire listing' : 'New hire listing'}</h2>
              <p>
                {mode === 'edit'
                  ? 'Changes show on the Car Rental marketplace immediately'
                  : 'Appears on the public Car Rental page under your yard'}
              </p>
            </div>
            <button type="button" className="admin-btn admin-btn-ghost" onClick={closeForm}>
              Cancel
            </button>
          </div>
          <form onSubmit={onSave} style={{ padding: '0 1.2rem 1.2rem' }}>
            <div className="grid-2">
              <div className="field">
                <label htmlFor="r-make">Make</label>
                <input
                  id="r-make"
                  required
                  value={draft.make}
                  onChange={(e) => patchDraft('make', e.target.value)}
                />
              </div>
              <div className="field">
                <label htmlFor="r-model">Model</label>
                <input
                  id="r-model"
                  required
                  value={draft.model}
                  onChange={(e) => patchDraft('model', e.target.value)}
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
                  value={draft.year}
                  onChange={(e) => patchDraft('year', Number(e.target.value) || draft.year)}
                />
              </div>
              <div className="field">
                <label htmlFor="r-body">Body</label>
                <select
                  id="r-body"
                  value={draft.bodyType}
                  onChange={(e) => patchDraft('bodyType', e.target.value as BodyType)}
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
                  value={draft.pricePerDay}
                  onChange={(e) => patchDraft('pricePerDay', Number(e.target.value) || 0)}
                />
              </div>
              <div className="field">
                <label htmlFor="r-week">Price / week (KES)</label>
                <input
                  id="r-week"
                  type="number"
                  min={1000}
                  required
                  value={draft.pricePerWeek}
                  onChange={(e) => patchDraft('pricePerWeek', Number(e.target.value) || 0)}
                />
              </div>
              <div className="field">
                <label htmlFor="r-deposit">Deposit (KES)</label>
                <input
                  id="r-deposit"
                  type="number"
                  min={0}
                  required
                  value={draft.deposit}
                  onChange={(e) => patchDraft('deposit', Number(e.target.value) || 0)}
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
                  value={draft.seats}
                  onChange={(e) => patchDraft('seats', Number(e.target.value) || 5)}
                />
              </div>
              <div className="field">
                <label htmlFor="r-trans">Transmission</label>
                <select
                  id="r-trans"
                  value={draft.transmission}
                  onChange={(e) =>
                    patchDraft('transmission', e.target.value as RentalCar['transmission'])
                  }
                >
                  <option>Automatic</option>
                  <option>Manual</option>
                </select>
              </div>
              <div className="field">
                <label htmlFor="r-fuel">Fuel</label>
                <select
                  id="r-fuel"
                  value={draft.fuel}
                  onChange={(e) => patchDraft('fuel', e.target.value as RentalCar['fuel'])}
                >
                  <option>Petrol</option>
                  <option>Diesel</option>
                  <option>Hybrid</option>
                  <option>Electric</option>
                </select>
              </div>
              <div className="field">
                <label htmlFor="r-city">City</label>
                <input
                  id="r-city"
                  required
                  value={draft.city}
                  onChange={(e) => patchDraft('city', e.target.value)}
                />
              </div>
              <div className="field">
                <label htmlFor="r-county">County</label>
                <input
                  id="r-county"
                  required
                  value={draft.county}
                  onChange={(e) => patchDraft('county', e.target.value)}
                />
              </div>
            </div>

            <div className="field" style={{ marginTop: '0.85rem' }}>
              <label htmlFor="r-desc">Description</label>
              <textarea
                id="r-desc"
                rows={3}
                value={draft.description}
                onChange={(e) => patchDraft('description', e.target.value)}
                placeholder="Who this hire car is best for…"
              />
            </div>

            <div className="field" style={{ marginTop: '0.85rem' }}>
              <label htmlFor="r-includes">Includes (comma-separated)</label>
              <input
                id="r-includes"
                value={draft.includesText}
                onChange={(e) => patchDraft('includesText', e.target.value)}
                placeholder="Insurance, Airport pickup, GPS"
              />
            </div>

            <ListingImageUploader
              images={draft.images}
              onChange={(images) => patchDraft('images', images)}
              label="Hire car photos"
            />

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '0.85rem' }}>
              <label className="check-row">
                <input
                  type="checkbox"
                  checked={draft.selfDrive}
                  onChange={(e) => patchDraft('selfDrive', e.target.checked)}
                />
                Self-drive
              </label>
              <label className="check-row">
                <input
                  type="checkbox"
                  checked={draft.withDriver}
                  onChange={(e) => patchDraft('withDriver', e.target.checked)}
                />
                With driver
              </label>
              <label className="check-row">
                <input
                  type="checkbox"
                  checked={draft.featured}
                  onChange={(e) => patchDraft('featured', e.target.checked)}
                />
                Featured hire
              </label>
              <label className="check-row">
                <input
                  type="checkbox"
                  checked={draft.available}
                  onChange={(e) => patchDraft('available', e.target.checked)}
                />
                Available now
              </label>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '1rem' }}>
              <button type="submit" className="admin-btn admin-btn-primary">
                {mode === 'edit' ? 'Save changes' : 'Publish hire listing'}
              </button>
              <button type="button" className="admin-btn admin-btn-ghost" onClick={closeForm}>
                Cancel
              </button>
            </div>
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
                      <button type="button" onClick={() => openEdit(car)}>
                        Edit
                      </button>
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
                      No hire cars yet. Tap <strong>Add listing</strong> to publish one.
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
