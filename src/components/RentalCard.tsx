import { Link } from 'react-router-dom'
import { formatKES } from '../data/cars'
import { getDealer } from '../data/dealers'
import type { RentalCar } from '../data/types'
import { VerifiedBadge } from './VerifiedBadge'
import './CarCard.css'

export function RentalCard({ rental }: { rental: RentalCar }) {
  const dealer = getDealer(rental.dealerId)

  return (
    <article className="shop-card">
      <Link to={`/rentals/${rental.id}`} className="shop-card-media">
        <img
          src={rental.images[0]}
          alt={`${rental.year} ${rental.make} ${rental.model}`}
          loading="lazy"
        />
        {rental.featured && <span className="shop-badge">Hire</span>}
        {!rental.available && <span className="shop-badge shop-badge-busy">Booked</span>}
      </Link>

      <div className="shop-card-body">
        <p className="shop-vendor with-verified">
          {dealer ? (
            <Link to={`/dealers/${dealer.id}`}>{dealer.name}</Link>
          ) : (
            <span>Dealer</span>
          )}
          {dealer?.verified && <VerifiedBadge title="Verified dealer" size={14} />}
        </p>
        <h3>
          <Link to={`/rentals/${rental.id}`}>
            {rental.year} {rental.make} {rental.model}
          </Link>
        </h3>
        <p className="shop-meta">
          {rental.seats} seats · {rental.transmission} · {rental.city}
        </p>
        <div className="shop-price-row">
          <p className="shop-price">
            {formatKES(rental.pricePerDay)}
            <span className="shop-per">/day</span>
          </p>
        </div>
        <Link to={`/rentals/${rental.id}`} className="shop-add">
          {rental.available ? 'Hire this car' : 'View details'}
        </Link>
      </div>
    </article>
  )
}
