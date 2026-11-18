import { useMemo, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ReportAccountModal } from '../components/ReportAccountModal'
import { VerifiedBadge } from '../components/VerifiedBadge'
import { formatKES } from '../data/cars'
import { getRental, getRentalOwner } from '../data/rentals'
import './CarDetail.css'
import './RentalDetail.css'

export function RentalDetail() {
  const { id } = useParams()
  const rental = getRental(id ?? '')
  const owner = rental ? getRentalOwner(rental.ownerId) : undefined
  const [days, setDays] = useState(3)
  const [withDriver, setWithDriver] = useState(false)
  const [sent, setSent] = useState(false)
  const [activeImage, setActiveImage] = useState(0)
  const [reportOpen, setReportOpen] = useState(false)

  const total = useMemo(() => {
    if (!rental) return 0
    const dayTotal = rental.pricePerDay * days
    const weekDiscount = days >= 7 ? dayTotal * 0.12 : 0
    const driverFee = withDriver && rental.withDriver ? 2500 * days : 0
    return Math.round(dayTotal - weekDiscount + driverFee)
  }, [rental, days, withDriver])

  if (!rental || !owner) {
    return (
      <section className="section container">
        <h1>Rental not found</h1>
        <p style={{ color: 'var(--fog, #565959)', marginTop: '0.75rem' }}>
          <Link to="/rentals">Browse rentals</Link>
        </p>
      </section>
    )
  }

  function onBook(e: FormEvent) {
    e.preventDefault()
    setSent(true)
  }

  return (
    <section className="section car-detail rental-detail">
      <div className="container">
        <nav className="amz-crumb">
          <Link to="/">Kenya Vehicles</Link>
          <span>›</span>
          <Link to="/rentals">Car rental</Link>
          <span>›</span>
          <span>
            {rental.make} {rental.model}
          </span>
        </nav>

        <div className="detail-grid">
          <div className="detail-gallery">
            <div className="detail-main-image">
              <img
                src={rental.images[activeImage]}
                alt={`${rental.year} ${rental.make} ${rental.model}`}
              />
            </div>
            <div className="detail-thumbs">
              {rental.images.map((img, i) => (
                <button
                  key={img}
                  type="button"
                  className={i === activeImage ? 'is-active' : undefined}
                  onClick={() => setActiveImage(i)}
                >
                  <img src={img} alt="" />
                </button>
              ))}
            </div>
          </div>

          <div className="detail-info">
            <p className="eyebrow">
              {rental.city}, {rental.county} · {rental.available ? 'Available' : 'Currently booked'}
            </p>
            <h1>
              {rental.year} {rental.make} {rental.model}
            </h1>
            <p className="detail-price">
              {formatKES(rental.pricePerDay)}
              <span className="rental-per"> / day</span>
            </p>
            <p className="rental-week">Week from {formatKES(rental.pricePerWeek)} · Deposit {formatKES(rental.deposit)}</p>

            <div className="detail-chips">
              <span className="badge badge-muted">{rental.bodyType}</span>
              <span className="badge badge-muted">{rental.transmission}</span>
              <span className="badge badge-muted">{rental.fuel}</span>
              <span className="badge badge-muted">{rental.seats} seats</span>
              {rental.selfDrive && <span className="badge badge-verified">Self-drive</span>}
              {rental.withDriver && <span className="badge badge-verified">With driver</span>}
            </div>

            <p className="detail-desc">{rental.description}</p>

            <ul className="detail-features">
              {rental.includes.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>

            <div className="dealer-box">
              <div>
                <p className="dealer-box-label">Offered by</p>
                <strong className="with-verified">
                  <span>{owner.name}</span>
                  {owner.verified && <VerifiedBadge title="Verified rental partner" size={15} />}
                </strong>
                <p>
                  {owner.city} · ★ {owner.rating} ({owner.reviewCount})
                </p>
                <button
                  type="button"
                  className="report-trigger"
                  style={{ marginTop: '0.45rem' }}
                  onClick={() => setReportOpen(true)}
                >
                  Report this partner
                </button>
              </div>
              <a href={`tel:${owner.phone.replace(/\s/g, '')}`} className="btn btn-primary">
                Call owner
              </a>
            </div>
          </div>
        </div>

        <form className="rental-book panel-card" onSubmit={onBook}>
          <h2>Request a hire</h2>
          <p>Send a booking request to {owner.name}. They will confirm availability and pickup.</p>

          {sent ? (
            <div className="enquire-success">
              Hire request sent. The owner typically replies within a few hours.
            </div>
          ) : (
            <>
              <div className="grid-2">
                <div className="field">
                  <label htmlFor="rname">Full name</label>
                  <input id="rname" required placeholder="Jane Wanjiku" />
                </div>
                <div className="field">
                  <label htmlFor="rphone">Phone</label>
                  <input id="rphone" required placeholder="+254 7.." />
                </div>
                <div className="field">
                  <label htmlFor="rdays">Number of days</label>
                  <input
                    id="rdays"
                    type="number"
                    min={1}
                    max={60}
                    value={days}
                    onChange={(e) => setDays(Number(e.target.value) || 1)}
                  />
                </div>
                <div className="field">
                  <label htmlFor="rstart">Start date</label>
                  <input id="rstart" type="date" required />
                </div>
              </div>

              {rental.withDriver && (
                <label className="check-row" style={{ marginTop: '0.85rem' }}>
                  <input
                    type="checkbox"
                    checked={withDriver}
                    onChange={(e) => setWithDriver(e.target.checked)}
                  />
                  Include driver (+ KES 2,500 / day)
                </label>
              )}

              <div className="rental-total">
                <span>Estimated hire total</span>
                <strong>{formatKES(total)}</strong>
              </div>
              <p className="rental-note">
                Deposit of {formatKES(rental.deposit)} is held separately and refunded after return
                inspection.
              </p>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={!rental.available}
                style={{ marginTop: '0.85rem' }}
              >
                {rental.available ? 'Send hire request' : 'Currently unavailable'}
              </button>
            </>
          )}
        </form>
      </div>

      <ReportAccountModal
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        targetType="Rental partner"
        targetId={owner.id}
        targetName={owner.name}
        relatedListing={`${rental.year} ${rental.make} ${rental.model} hire`}
      />
    </section>
  )
}
