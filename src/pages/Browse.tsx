import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CarCard } from '../components/CarCard'
import { cars } from '../data/cars'
import type { BodyType } from '../data/types'
import './Browse.css'

const bodyTypes: Array<BodyType | 'All'> = [
  'All',
  'SUV',
  'Sedan',
  'Hatchback',
  'Pickup',
  'Van',
  'Coupe',
]

const counties = ['All', 'Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Uasin Gishu']

export function Browse() {
  const [params] = useSearchParams()
  const [q, setQ] = useState(params.get('q') ?? '')
  const [county, setCounty] = useState(params.get('county') ?? 'All')
  const [bodyType, setBodyType] = useState<BodyType | 'All'>('All')

  useEffect(() => {
    setQ(params.get('q') ?? '')
    setCounty(params.get('county') ?? 'All')
    const body = (params.get('body') as BodyType | null) ?? 'All'
    setBodyType(bodyTypes.includes(body) ? body : 'All')
  }, [params])
  const [maxPrice, setMaxPrice] = useState(10000000)
  const [sort, setSort] = useState<'featured' | 'price-asc' | 'price-desc' | 'year-desc'>('featured')

  const filtered = useMemo(() => {
    let list = cars.filter((car) => {
      const hay = `${car.make} ${car.model} ${car.city} ${car.condition}`.toLowerCase()
      const matchesQ = !q || hay.includes(q.toLowerCase())
      const matchesCounty = county === 'All' || car.county === county
      const matchesBody = bodyType === 'All' || car.bodyType === bodyType
      const matchesPrice = car.price <= maxPrice
      return matchesQ && matchesCounty && matchesBody && matchesPrice
    })

    list = [...list].sort((a, b) => {
      if (sort === 'price-asc') return a.price - b.price
      if (sort === 'price-desc') return b.price - a.price
      if (sort === 'year-desc') return b.year - a.year
      return Number(b.featured) - Number(a.featured)
    })

    return list
  }, [q, county, bodyType, maxPrice, sort])

  return (
    <section className="section browse">
      <div className="container">
        <nav className="amz-crumb">
          <Link to="/">Kenya Vehicles</Link>
          <span>›</span>
          <span>Cars</span>
          {bodyType !== 'All' && (
            <>
              <span>›</span>
              <span>{bodyType}</span>
            </>
          )}
        </nav>

        <div className="browse-layout">
          <aside className="browse-filters panel-card">
            <h2>Filters</h2>
            <div className="field">
              <label htmlFor="search">Keywords</label>
              <input
                id="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Toyota, Hilux…"
              />
            </div>
            <div className="field">
              <label htmlFor="county">County</label>
              <select id="county" value={county} onChange={(e) => setCounty(e.target.value)}>
                {counties.map((c) => (
                  <option key={c} value={c}>
                    {c === 'All' ? 'All Kenya' : c}
                  </option>
                ))}
              </select>
            </div>
            <div className="filter-group">
              <h3>Body type</h3>
              {bodyTypes.map((b) => (
                <label key={b} className="check-row">
                  <input
                    type="radio"
                    name="body"
                    checked={bodyType === b}
                    onChange={() => setBodyType(b)}
                  />
                  {b === 'All' ? 'Any' : b}
                </label>
              ))}
            </div>
            <div className="field">
              <label htmlFor="price">Max price: KES {maxPrice.toLocaleString('en-KE')}</label>
              <input
                id="price"
                type="range"
                min={500000}
                max={10000000}
                step={100000}
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
              />
            </div>
          </aside>

          <div className="browse-results">
            <div className="browse-toolbar panel-card">
              <div>
                <h1>
                  {filtered.length} results{q ? ` for "${q}"` : ''}
                </h1>
                <p>Cars from Kenya Vehicles dealers across Kenya</p>
              </div>
              <div className="field">
                <label htmlFor="sort">Sort by</label>
                <select
                  id="sort"
                  value={sort}
                  onChange={(e) => setSort(e.target.value as typeof sort)}
                >
                  <option value="featured">Featured</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="year-desc">Newest year</option>
                </select>
              </div>
            </div>

            {filtered.length === 0 ? (
              <div className="browse-empty panel-card">
                <h3>No results</h3>
                <p>Try clearing filters or searching a different make.</p>
              </div>
            ) : (
              <div className="grid-cars">
                {filtered.map((car) => (
                  <CarCard key={car.id} car={car} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
