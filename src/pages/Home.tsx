import { Link } from 'react-router-dom'
import { CarCard } from '../components/CarCard'
import { VerifiedBadge } from '../components/VerifiedBadge'
import { cars } from '../data/cars'
import { dealers } from '../data/dealers'
import { loanPartners } from '../data/loans'
import './Home.css'

export function Home() {
  const featured = cars.filter((c) => c.featured).slice(0, 6)
  const budget = [...cars].sort((a, b) => a.price - b.price).slice(0, 6)
  const topDealers = dealers.filter((d) => d.verified).slice(0, 4)

  return (
    <div className="amz-home">
      <div className="container amz-home-body">
        <section className="amz-shelf">
          <div className="amz-shelf-head">
            <h2>Featured cars | Top deals this week</h2>
            <Link to="/cars">See all</Link>
          </div>
          <div className="grid-cars">
            {featured.map((car) => (
              <CarCard key={car.id} car={car} />
            ))}
          </div>
        </section>

        <section className="amz-shelf">
          <div className="amz-shelf-head">
            <h2>Kenya favourites under KES 1.5M</h2>
            <Link to="/cars">See more</Link>
          </div>
          <div className="grid-cars">
            {budget.map((car) => (
              <CarCard key={car.id} car={car} />
            ))}
          </div>
        </section>

        <section className="amz-promo-row">
          <div className="amz-promo panel-card">
            <h2>Car loans on Kenya Vehicles</h2>
            <p>Compare banks, saccos &amp; fintechs — apply while you shop.</p>
            <div className="amz-promo-logos">
              {loanPartners.slice(0, 4).map((p) => (
                <span key={p.id} className="amz-promo-loan">
                  {p.logo ? <img src={p.logo} alt="" /> : null}
                  {p.name} · ★ {p.rating}
                </span>
              ))}
            </div>
            <Link to="/loans" className="btn btn-primary">
              Compare loans
            </Link>
          </div>
          <div className="amz-promo panel-card">
            <h2>Sell on Kenya Vehicles</h2>
            <p>List your yard and reach buyers across Kenya with financing attached.</p>
            <ul>
              <li>Verified dealer badge</li>
              <li>Loan partners on every listing</li>
              <li>Direct buyer enquiries</li>
            </ul>
            <Link to="/join" className="btn btn-ghost">
              Start selling
            </Link>
          </div>
        </section>

        <section className="amz-shelf">
          <div className="amz-shelf-head">
            <h2>Top dealers in Kenya</h2>
            <Link to="/dealers">See all dealers</Link>
          </div>
          <div className="amz-dealer-row">
            {topDealers.map((dealer) => (
              <Link key={dealer.id} to={`/dealers/${dealer.id}`} className="amz-dealer-card panel-card">
                <img src={dealer.coverImage} alt="" loading="lazy" />
                <h3 className="with-verified">
                  {dealer.logo && (
                    <img src={dealer.logo} alt="" className="amz-dealer-logo" loading="lazy" />
                  )}
                  <span>{dealer.name}</span>
                  {dealer.verified && <VerifiedBadge title="Verified dealer" size={15} />}
                </h3>
                <p className="stars">★★★★★ <span>{dealer.rating}</span></p>
                <p>
                  {dealer.city} · {dealer.carsListed} cars
                </p>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
