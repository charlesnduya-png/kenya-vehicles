import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { CarCard } from '../components/CarCard'
import { MessageDealerModal } from '../components/MessageDealerModal'
import { ReportAccountModal } from '../components/ReportAccountModal'
import { VerifiedBadge } from '../components/VerifiedBadge'
import { getCarsByDealer } from '../data/cars'
import { getDealer } from '../data/dealers'
import './DealerDetail.css'

export function DealerDetail() {
  const { id } = useParams()
  const dealer = getDealer(id ?? '')
  const stock = dealer ? getCarsByDealer(dealer.id) : []
  const [reportOpen, setReportOpen] = useState(false)
  const [messageOpen, setMessageOpen] = useState(false)

  if (!dealer) {
    return (
      <section className="section container">
        <h1>Dealer not found</h1>
        <p style={{ color: 'var(--fog)', marginTop: '0.75rem' }}>
          <Link to="/dealers">Back to dealers</Link>
        </p>
      </section>
    )
  }

  return (
    <section className="section dealer-detail">
      <div className="dealer-hero">
        <img src={dealer.coverImage} alt="" />
        <div className="dealer-hero-scrim" />
        <div className="container dealer-hero-content fade-up">
          <Link to="/dealers" className="back-link">
            ← All dealers
          </Link>
          <div className="dealer-hero-row">
            <div className="dealer-hero-identity">
              {dealer.logo && (
                <img src={dealer.logo} alt={`${dealer.name} logo`} className="dealer-logo" />
              )}
              <div>
                <h1 className="with-verified">
                  <span>{dealer.name}</span>
                  {dealer.verified && (
                    <VerifiedBadge title="Verified Kenya Vehicles dealer" size={22} />
                  )}
                </h1>
                <p>
                  {dealer.city}, {dealer.county} · {dealer.specialty}
                </p>
              </div>
            </div>
            <div className="dealer-hero-actions">
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setMessageOpen(true)}
              >
                Message yard
              </button>
              <a href={`tel:${dealer.phone.replace(/\s/g, '')}`} className="btn btn-ghost">
                Call {dealer.phone}
              </a>
              <button
                type="button"
                className="report-trigger report-trigger-danger"
                onClick={() => setReportOpen(true)}
              >
                Report this dealer
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container dealer-detail-body">
        <div className="dealer-about fade-up">
          <h2>About</h2>
          <p>{dealer.bio}</p>
          <div className="dealer-stats-row">
            <div>
              <strong>★ {dealer.rating}</strong>
              <span>{dealer.reviewCount} reviews</span>
            </div>
            <div>
              <strong>{dealer.carsListed}</strong>
              <span>cars listed</span>
            </div>
            <div>
              <strong>{dealer.yearsActive}</strong>
              <span>years active</span>
            </div>
            <div>
              <strong>{dealer.email}</strong>
              <span>email</span>
            </div>
          </div>
        </div>

        <div className="section-head" style={{ marginTop: '2.5rem' }}>
          <div>
            <p className="eyebrow">Inventory</p>
            <h2>Cars from {dealer.name}</h2>
          </div>
        </div>
        {stock.length === 0 ? (
          <p style={{ color: 'var(--fog)' }}>No live stock right now — check back soon.</p>
        ) : (
          <div className="grid-cars">
            {stock.map((car) => (
              <CarCard key={car.id} car={car} />
            ))}
          </div>
        )}
      </div>

      <ReportAccountModal
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        targetType="Dealer"
        targetId={dealer.id}
        targetName={dealer.name}
      />
      <MessageDealerModal
        open={messageOpen}
        onClose={() => setMessageOpen(false)}
        dealerId={dealer.id}
        dealerName={dealer.name}
      />
    </section>
  )
}
