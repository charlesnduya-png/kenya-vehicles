import { Link } from 'react-router-dom'
import { formatKES, formatMileage } from '../data/cars'
import type { Car } from '../data/types'
import { getDealer } from '../data/dealers'
import { VerifiedBadge } from './VerifiedBadge'
import './CarCard.css'

export function CarCard({ car }: { car: Car }) {
  const dealer = getDealer(car.dealerId)

  return (
    <article className="shop-card">
      <Link to={`/cars/${car.id}`} className="shop-card-media">
        <img src={car.images[0]} alt={`${car.year} ${car.make} ${car.model}`} loading="lazy" />
        {car.featured && <span className="shop-badge">Sale</span>}
      </Link>

      <div className="shop-card-body">
        <p className="shop-vendor with-verified">
          <span>{dealer?.name ?? 'Kenya Vehicles'}</span>
          {dealer?.verified && <VerifiedBadge title="Verified dealer" size={14} />}
        </p>
        <h3>
          <Link to={`/cars/${car.id}`}>
            {car.year} {car.make} {car.model}
          </Link>
        </h3>
        <p className="shop-meta">
          {formatMileage(car.mileage)} · {car.transmission} · {car.city}
        </p>
        <div className="shop-price-row">
          <p className="shop-price">{formatKES(car.price)}</p>
        </div>
        <div className="shop-actions">
          <Link to={`/cars/${car.id}`} className="shop-add">
            View vehicle
          </Link>
        </div>
      </div>
    </article>
  )
}
