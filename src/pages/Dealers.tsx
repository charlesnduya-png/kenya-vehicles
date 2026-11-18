import { Link } from 'react-router-dom'
import { VerifiedBadge } from '../components/VerifiedBadge'
import { dealers } from '../data/dealers'
import './Dealers.css'

export function Dealers() {
  return (
    <section className="section dealers-page">
      <div className="container">
        <div className="dealers-page-head fade-up">
          <div>
            <p className="eyebrow">Dealer network</p>
            <h1>Dealers across Kenya</h1>
            <p>
              Verified yards from Nairobi to the coast — browse stock, ratings, and specialties
              before you visit.
            </p>
          </div>
          <Link to="/join" className="btn btn-primary">
            Join as a dealer
          </Link>
        </div>

        <div className="dealers-grid">
          {dealers.map((dealer, i) => (
            <Link
              key={dealer.id}
              to={`/dealers/${dealer.id}`}
              className={`dealer-card fade-up fade-up-delay-${Math.min(i, 3)}`}
            >
              <div className="dealer-card-media">
                <img src={dealer.coverImage} alt="" loading="lazy" />
              </div>
              <div className="dealer-card-body">
                <div className="dealer-card-top">
                  {dealer.logo && (
                    <img src={dealer.logo} alt="" className="dealer-card-logo" loading="lazy" />
                  )}
                  <h2 className="with-verified">
                    <span>{dealer.name}</span>
                    {dealer.verified && <VerifiedBadge title="Verified dealer" />}
                  </h2>
                </div>
                <p className="dealer-card-meta">
                  {dealer.city}, {dealer.county} · {dealer.specialty}
                </p>
                <p className="dealer-card-bio">{dealer.bio}</p>
                <div className="dealer-card-stats">
                  <span>★ {dealer.rating}</span>
                  <span>{dealer.carsListed} cars</span>
                  <span>{dealer.yearsActive} yrs</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
