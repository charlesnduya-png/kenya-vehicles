import { type FormEvent, useEffect, useMemo, useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import type { AuthSession } from '../data/auth'
import {
  addCar,
  formatKES,
  formatMileage,
  getCarsByDealer,
  subscribeCars,
  updateCar,
} from '../data/cars'
import type { BodyType, Car, Dealer } from '../data/types'

type Ctx = { session: AuthSession; dealer?: Dealer }

const bodies: BodyType[] = ['SUV', 'Sedan', 'Hatchback', 'Pickup', 'Van', 'Coupe']
const conditions: Car['condition'][] = ['Foreign Used', 'Locally Used', 'Brand New']

type Draft = {
  make: string
  model: string
  year: number
  price: number
  mileage: number
  transmission: Car['transmission']
  fuel: Car['fuel']
  bodyType: BodyType
  color: string
  city: string
  county: string
  condition: Car['condition']
  featured: boolean
  description: string
  featuresText: string
}

function draftFromCar(car: Car): Draft {
  return {
    make: car.make,
    model: car.model,
    year: car.year,
    price: car.price,
    mileage: car.mileage,
    transmission: car.transmission,
    fuel: car.fuel,
    bodyType: car.bodyType,
    color: car.color,
    city: car.city,
    county: car.county,
    condition: car.condition,
    featured: car.featured,
    description: car.description,
    featuresText: car.features.join(', '),
  }
}

function emptyDraft(dealer?: Dealer, cityFallback = 'Nairobi'): Draft {
  return {
    make: 'Toyota',
    model: '',
    year: 2018,
    price: 1500000,
    mileage: 80000,
    transmission: 'Automatic',
    fuel: 'Petrol',
    bodyType: 'Sedan',
    color: 'White',
    city: dealer?.city ?? cityFallback,
    county: dealer?.county ?? dealer?.city ?? cityFallback,
    condition: 'Foreign Used',
    featured: false,
    description: '',
    featuresText: '',
  }
}

export function DealerInventory() {
  const { session, dealer } = useOutletContext<Ctx>()
  const dealerId = session.dealerId ?? ''
  const [q, setQ] = useState('')
  const [stock, setStock] = useState(() => (dealerId ? getCarsByDealer(dealerId) : []))
  const [mode, setMode] = useState<'closed' | 'add' | 'edit'>('closed')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState<Draft>(() => emptyDraft(dealer, session.city))
  const [toast, setToast] = useState('')

  useEffect(() => {
    if (!dealerId) return
    const refresh = () => setStock(getCarsByDealer(dealerId))
    refresh()
    return subscribeCars(refresh)
  }, [dealerId])

  const filtered = useMemo(() => {
    return stock.filter((car) => {
      const hay = `${car.make} ${car.model} ${car.bodyType} ${car.city}`.toLowerCase()
      return !q || hay.includes(q.toLowerCase())
    })
  }, [stock, q])

  function flash(message: string) {
    setToast(message)
    window.setTimeout(() => setToast(''), 2600)
  }

  function openAdd() {
    setMode('add')
    setEditingId(null)
    setDraft(emptyDraft(dealer, session.city))
  }

  function openEdit(car: Car) {
    setMode('edit')
    setEditingId(car.id)
    setDraft(draftFromCar(car))
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
    const features = draft.featuresText
      .split(',')
      .map((f) => f.trim())
      .filter(Boolean)

    if (mode === 'edit' && editingId) {
      updateCar(editingId, dealerId, {
        make: draft.make,
        model: draft.model,
        year: draft.year,
        price: draft.price,
        mileage: draft.mileage,
        transmission: draft.transmission,
        fuel: draft.fuel,
        bodyType: draft.bodyType,
        color: draft.color,
        city: draft.city,
        county: draft.county,
        condition: draft.condition,
        featured: draft.featured,
        description: draft.description,
        features,
      })
      flash('Listing updated')
    } else {
      addCar({
        dealerId,
        make: draft.make,
        model: draft.model,
        year: draft.year,
        price: draft.price,
        mileage: draft.mileage,
        transmission: draft.transmission,
        fuel: draft.fuel,
        bodyType: draft.bodyType,
        color: draft.color,
        city: draft.city,
        county: draft.county,
        condition: draft.condition,
        featured: draft.featured,
        description: draft.description,
        features,
      })
      flash('Listing published')
    }
    closeForm()
  }

  return (
    <>
      {toast && <div className="admin-toast">{toast}</div>}

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
          <button
            type="button"
            className="admin-btn admin-btn-primary"
            onClick={() => (mode === 'add' ? closeForm() : openAdd())}
          >
            {mode === 'add' ? 'Close form' : 'Add listing'}
          </button>
          <span className="admin-btn admin-btn-ghost">{filtered.length} cars</span>
        </div>
      </div>

      {mode !== 'closed' && (
        <section className="admin-panel" style={{ marginBottom: '1rem' }}>
          <div className="admin-panel-head">
            <div>
              <h2>{mode === 'edit' ? 'Edit listing' : 'New listing'}</h2>
              <p>
                {mode === 'edit'
                  ? 'Changes show on the marketplace immediately'
                  : 'Publish a sale car under your yard'}
              </p>
            </div>
            <button type="button" className="admin-btn admin-btn-ghost" onClick={closeForm}>
              Cancel
            </button>
          </div>
          <form onSubmit={onSave} style={{ padding: '0 1.2rem 1.2rem' }}>
            <div className="grid-2">
              <div className="field">
                <label htmlFor="inv-make">Make</label>
                <input
                  id="inv-make"
                  required
                  value={draft.make}
                  onChange={(e) => patchDraft('make', e.target.value)}
                />
              </div>
              <div className="field">
                <label htmlFor="inv-model">Model</label>
                <input
                  id="inv-model"
                  required
                  value={draft.model}
                  onChange={(e) => patchDraft('model', e.target.value)}
                  placeholder="Harrier"
                />
              </div>
              <div className="field">
                <label htmlFor="inv-year">Year</label>
                <input
                  id="inv-year"
                  type="number"
                  min={1990}
                  max={2030}
                  required
                  value={draft.year}
                  onChange={(e) => patchDraft('year', Number(e.target.value) || draft.year)}
                />
              </div>
              <div className="field">
                <label htmlFor="inv-price">Price (KES)</label>
                <input
                  id="inv-price"
                  type="number"
                  min={50000}
                  required
                  value={draft.price}
                  onChange={(e) => patchDraft('price', Number(e.target.value) || 0)}
                />
              </div>
              <div className="field">
                <label htmlFor="inv-mileage">Mileage (km)</label>
                <input
                  id="inv-mileage"
                  type="number"
                  min={0}
                  required
                  value={draft.mileage}
                  onChange={(e) => patchDraft('mileage', Number(e.target.value) || 0)}
                />
              </div>
              <div className="field">
                <label htmlFor="inv-color">Color</label>
                <input
                  id="inv-color"
                  required
                  value={draft.color}
                  onChange={(e) => patchDraft('color', e.target.value)}
                />
              </div>
              <div className="field">
                <label htmlFor="inv-body">Body</label>
                <select
                  id="inv-body"
                  value={draft.bodyType}
                  onChange={(e) => patchDraft('bodyType', e.target.value as BodyType)}
                >
                  {bodies.map((b) => (
                    <option key={b}>{b}</option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="inv-condition">Condition</label>
                <select
                  id="inv-condition"
                  value={draft.condition}
                  onChange={(e) => patchDraft('condition', e.target.value as Car['condition'])}
                >
                  {conditions.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="inv-trans">Transmission</label>
                <select
                  id="inv-trans"
                  value={draft.transmission}
                  onChange={(e) =>
                    patchDraft('transmission', e.target.value as Car['transmission'])
                  }
                >
                  <option>Automatic</option>
                  <option>Manual</option>
                </select>
              </div>
              <div className="field">
                <label htmlFor="inv-fuel">Fuel</label>
                <select
                  id="inv-fuel"
                  value={draft.fuel}
                  onChange={(e) => patchDraft('fuel', e.target.value as Car['fuel'])}
                >
                  <option>Petrol</option>
                  <option>Diesel</option>
                  <option>Hybrid</option>
                  <option>Electric</option>
                </select>
              </div>
              <div className="field">
                <label htmlFor="inv-city">City</label>
                <input
                  id="inv-city"
                  required
                  value={draft.city}
                  onChange={(e) => patchDraft('city', e.target.value)}
                />
              </div>
              <div className="field">
                <label htmlFor="inv-county">County</label>
                <input
                  id="inv-county"
                  required
                  value={draft.county}
                  onChange={(e) => patchDraft('county', e.target.value)}
                />
              </div>
            </div>

            <div className="field" style={{ marginTop: '0.85rem' }}>
              <label htmlFor="inv-desc">Description</label>
              <textarea
                id="inv-desc"
                rows={3}
                value={draft.description}
                onChange={(e) => patchDraft('description', e.target.value)}
                placeholder="Condition, history, what buyers should know…"
              />
            </div>

            <div className="field" style={{ marginTop: '0.85rem' }}>
              <label htmlFor="inv-features">Features (comma-separated)</label>
              <input
                id="inv-features"
                value={draft.featuresText}
                onChange={(e) => patchDraft('featuresText', e.target.value)}
                placeholder="Sunroof, Reverse camera, Leather seats"
              />
            </div>

            <label className="check-row" style={{ marginTop: '0.85rem' }}>
              <input
                type="checkbox"
                checked={draft.featured}
                onChange={(e) => patchDraft('featured', e.target.checked)}
              />
              Featured on homepage
            </label>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '1rem' }}>
              <button type="submit" className="admin-btn admin-btn-primary">
                {mode === 'edit' ? 'Save changes' : 'Publish listing'}
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
                      <button type="button" onClick={() => openEdit(car)}>
                        Edit
                      </button>
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
