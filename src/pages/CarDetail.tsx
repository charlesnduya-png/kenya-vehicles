import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { MessageDealerModal } from '../components/MessageDealerModal'
import { ReportAccountModal } from '../components/ReportAccountModal'
import { VerifiedBadge } from '../components/VerifiedBadge'
import { formatKES, formatMileage, getCar } from '../data/cars'
import { getDealer } from '../data/dealers'
import { submitEnquiry } from '../data/enquiries'
import { estimateMonthlyPayment, loanPartners } from '../data/loans'
import { submitOffer } from '../data/offers'
import './CarDetail.css'

export function CarDetail() {
  const { id } = useParams()
  const car = getCar(id ?? '')
  const dealer = car ? getDealer(car.dealerId) : undefined
  const [activeImage, setActiveImage] = useState(0)
  const [deposit, setDeposit] = useState(20)
  const [months, setMonths] = useState(48)
  const [rate, setRate] = useState(14)
  const [sent, setSent] = useState(false)
  const [enquireName, setEnquireName] = useState('')
  const [enquirePhone, setEnquirePhone] = useState('')
  const [enquireMsg, setEnquireMsg] = useState('')
  const [loanSent, setLoanSent] = useState(false)
  const [loanName, setLoanName] = useState('')
  const [loanPhone, setLoanPhone] = useState('')
  const [loanPartnerId, setLoanPartnerId] = useState(loanPartners[0]?.id ?? '')
  const [offerSent, setOfferSent] = useState(false)
  const [offerAmount, setOfferAmount] = useState('')
  const [offerName, setOfferName] = useState('')
  const [offerPhone, setOfferPhone] = useState('')
  const [offerEmail, setOfferEmail] = useState('')
  const [offerMessage, setOfferMessage] = useState('')
  const [offerError, setOfferError] = useState('')
  const [reportOpen, setReportOpen] = useState(false)
  const [messageOpen, setMessageOpen] = useState(false)

  useEffect(() => {
    if (car) {
      setOfferAmount(String(Math.round(car.price * 0.92)))
      setEnquireMsg(
        `Hi, I'm interested in the ${car.year} ${car.make} ${car.model}. Is it still available?`,
      )
    }
  }, [car])

  useEffect(() => {
    if (window.location.hash === '#offer') {
      document.getElementById('offer')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
    if (window.location.hash === '#loan') {
      document.getElementById('loan')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [])

  const monthly = useMemo(() => {
    if (!car) return 0
    return estimateMonthlyPayment(car.price, deposit, rate, months)
  }, [car, deposit, rate, months])

  if (!car || !dealer) {
    return (
      <section className="section container">
        <h1>Car not found</h1>
        <p style={{ color: 'var(--fog)', marginTop: '0.75rem' }}>
          This listing may have been sold. <Link to="/cars">Browse cars</Link>
        </p>
      </section>
    )
  }

  const carLabel = `${car.year} ${car.make} ${car.model}`

  function onEnquire(e: FormEvent) {
    e.preventDefault()
    submitEnquiry({
      type: 'Car sale',
      dealerId: dealer!.id,
      dealerName: dealer!.name,
      carId: car!.id,
      carLabel,
      carPrice: car!.price,
      customerName: enquireName.trim(),
      customerPhone: enquirePhone.trim(),
      message: enquireMsg.trim() || `Interested in ${carLabel}`,
    })
    setSent(true)
  }

  function onLoanRequest(e: FormEvent) {
    e.preventDefault()
    const partner = loanPartners.find((p) => p.id === loanPartnerId)
    submitEnquiry({
      type: 'Loan',
      dealerId: dealer!.id,
      dealerName: dealer!.name,
      carId: car!.id,
      carLabel,
      carPrice: car!.price,
      customerName: loanName.trim(),
      customerPhone: loanPhone.trim(),
      message: `Wants to purchase ${carLabel} on loan through ${partner?.name ?? 'a loan partner'}.`,
      loanPartnerId: partner?.id,
      loanPartnerName: partner?.name,
      depositPercent: deposit,
      termMonths: months,
      estimatedMonthly: monthly,
    })
    setLoanSent(true)
  }

  function onOffer(e: FormEvent) {
    e.preventDefault()
    if (!car || !dealer) return
    const amount = Number(offerAmount.replace(/[^\d]/g, ''))
    if (!amount || amount < 10000) {
      setOfferError('Enter a valid offer amount in KES.')
      return
    }
    if (amount >= car.price) {
      setOfferError('Your offer should be below the asking price, or enquire to buy at list price.')
      return
    }
    submitOffer({
      carId: car.id,
      dealerId: dealer.id,
      carLabel: `${car.year} ${car.make} ${car.model}`,
      askingPrice: car.price,
      amount,
      message: offerMessage.trim(),
      buyerName: offerName.trim(),
      buyerPhone: offerPhone.trim(),
      buyerEmail: offerEmail.trim(),
    })
    setOfferError('')
    setOfferSent(true)
  }

  return (
    <section className="section car-detail">
      <div className="container">
        <nav className="amz-crumb">
          <Link to="/">Kenya Vehicles</Link>
          <span>›</span>
          <Link to="/cars">Cars</Link>
          <span>›</span>
          <Link to={`/cars?body=${car.bodyType}`}>{car.bodyType}</Link>
          <span>›</span>
          <span>
            {car.make} {car.model}
          </span>
        </nav>

        <div className="detail-grid">
          <div className="detail-gallery fade-up">
            <div className="detail-main-image">
              <img src={car.images[activeImage]} alt={`${car.year} ${car.make} ${car.model}`} />
            </div>
            <div className="detail-thumbs">
              {car.images.map((img, i) => (
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

          <div className="detail-info fade-up fade-up-delay-1">
            <p className="eyebrow">{car.city}, {car.county}</p>
            <h1>
              {car.year} {car.make} {car.model}
            </h1>
            <p className="detail-price">{formatKES(car.price)}</p>
            <div className="detail-cta-row">
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setMessageOpen(true)}
              >
                Message dealer
              </button>
              <a href="#offer" className="btn btn-ghost btn-make-offer">
                Make an offer
              </a>
              <a href="#loan" className="btn btn-buy-loan">
                Buy on loan
              </a>
            </div>
            <div className="detail-chips">
              <span className="badge badge-muted">{car.condition}</span>
              <span className="badge badge-muted">{car.bodyType}</span>
              <span className="badge badge-muted">{car.transmission}</span>
              <span className="badge badge-muted">{car.fuel}</span>
            </div>

            <dl className="detail-specs">
              <div>
                <dt>Mileage</dt>
                <dd>{formatMileage(car.mileage)}</dd>
              </div>
              <div>
                <dt>Color</dt>
                <dd>{car.color}</dd>
              </div>
              <div>
                <dt>Fuel</dt>
                <dd>{car.fuel}</dd>
              </div>
              <div>
                <dt>Body</dt>
                <dd>{car.bodyType}</dd>
              </div>
            </dl>

            <p className="detail-desc">{car.description}</p>

            <ul className="detail-features">
              {car.features.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>

            <div className="dealer-box">
              <div>
                <p className="dealer-box-label">Listed by</p>
                <Link to={`/dealers/${dealer.id}`} className="with-verified">
                  <strong>{dealer.name}</strong>
                  {dealer.verified && <VerifiedBadge title="Verified dealer" size={15} />}
                </Link>
                <p>
                  {dealer.city} · ★ {dealer.rating}
                </p>
                <button
                  type="button"
                  className="report-trigger"
                  style={{ marginTop: '0.45rem' }}
                  onClick={() => setReportOpen(true)}
                >
                  Report this seller
                </button>
              </div>
              <div className="dealer-box-actions">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setMessageOpen(true)}
                >
                  Message
                </button>
                <a href={`tel:${dealer.phone.replace(/\s/g, '')}`} className="btn btn-ghost">
                  Call
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="detail-lower">
          <form className="enquire-card fade-up" onSubmit={onEnquire}>
            <h2>Enquire about this car</h2>
            <p>We share your message with {dealer.name}. They&apos;ll contact you directly.</p>
            {sent ? (
              <div className="enquire-success">
                Enquiry sent. The dealer typically replies within a few hours.
              </div>
            ) : (
              <>
                <div className="grid-2">
                  <div className="field">
                    <label htmlFor="name">Full name</label>
                    <input
                      id="name"
                      required
                      value={enquireName}
                      onChange={(e) => setEnquireName(e.target.value)}
                      placeholder="Jane Wanjiku"
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="phone">Phone</label>
                    <input
                      id="phone"
                      required
                      value={enquirePhone}
                      onChange={(e) => setEnquirePhone(e.target.value)}
                      placeholder="+254 7.."
                    />
                  </div>
                </div>
                <div className="field" style={{ marginTop: '0.85rem' }}>
                  <label htmlFor="msg">Message</label>
                  <textarea
                    id="msg"
                    value={enquireMsg}
                    onChange={(e) => setEnquireMsg(e.target.value)}
                  />
                </div>
                <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem' }}>
                  Send enquiry
                </button>
              </>
            )}
          </form>

          <form id="offer" className="enquire-card offer-card fade-up" onSubmit={onOffer}>
            <h2>Make an offer</h2>
            <p>
              Suggest your price to {dealer.name}. Asking price is{' '}
              <strong>{formatKES(car.price)}</strong>.
            </p>
            {offerSent ? (
              <div className="enquire-success">
                Offer sent. The dealer can accept or decline from their portal.
              </div>
            ) : (
              <>
                <div className="field">
                  <label htmlFor="offer-amount">Your offer (KES)</label>
                  <input
                    id="offer-amount"
                    inputMode="numeric"
                    required
                    value={offerAmount}
                    onChange={(e) => setOfferAmount(e.target.value)}
                    placeholder="e.g. 3500000"
                  />
                </div>
                <div className="grid-2" style={{ marginTop: '0.75rem' }}>
                  <div className="field">
                    <label htmlFor="offer-name">Full name</label>
                    <input
                      id="offer-name"
                      required
                      value={offerName}
                      onChange={(e) => setOfferName(e.target.value)}
                      placeholder="Jane Wanjiku"
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="offer-phone">Phone</label>
                    <input
                      id="offer-phone"
                      required
                      value={offerPhone}
                      onChange={(e) => setOfferPhone(e.target.value)}
                      placeholder="+254 7.."
                    />
                  </div>
                </div>
                <div className="field" style={{ marginTop: '0.75rem' }}>
                  <label htmlFor="offer-email">Email</label>
                  <input
                    id="offer-email"
                    type="email"
                    required
                    value={offerEmail}
                    onChange={(e) => setOfferEmail(e.target.value)}
                    placeholder="you@email.com"
                  />
                </div>
                <div className="field" style={{ marginTop: '0.75rem' }}>
                  <label htmlFor="offer-msg">Message (optional)</label>
                  <textarea
                    id="offer-msg"
                    value={offerMessage}
                    onChange={(e) => setOfferMessage(e.target.value)}
                    placeholder="Ready to view this week / cash buyer / need finance…"
                    rows={3}
                  />
                </div>
                {offerError && <p className="offer-error">{offerError}</p>}
                <div className="offer-quick">
                  {[0.95, 0.9, 0.85].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      className="offer-chip"
                      onClick={() => setOfferAmount(String(Math.round(car.price * pct)))}
                    >
                      {Math.round(pct * 100)}% · {formatKES(Math.round(car.price * pct))}
                    </button>
                  ))}
                </div>
                <button type="submit" className="btn btn-primary" style={{ marginTop: '0.85rem' }}>
                  Submit offer
                </button>
              </>
            )}
          </form>

          <div id="loan" className="finance-card fade-up fade-up-delay-1">
            <h2>Finance this car</h2>
            <p>
              Estimate monthly payments, then request to buy on loan. {dealer.name} will see your
              request in their enquiries inbox.
            </p>

            <div className="finance-sliders">
              <div className="field">
                <label htmlFor="deposit">Deposit {deposit}%</label>
                <input
                  id="deposit"
                  type="range"
                  min={10}
                  max={50}
                  value={deposit}
                  onChange={(e) => setDeposit(Number(e.target.value))}
                />
              </div>
              <div className="field">
                <label htmlFor="months">Term {months} months</label>
                <input
                  id="months"
                  type="range"
                  min={12}
                  max={72}
                  step={6}
                  value={months}
                  onChange={(e) => setMonths(Number(e.target.value))}
                />
              </div>
              <div className="field">
                <label htmlFor="rate">Rate {rate}% p.a.</label>
                <input
                  id="rate"
                  type="range"
                  min={10}
                  max={20}
                  step={0.5}
                  value={rate}
                  onChange={(e) => setRate(Number(e.target.value))}
                />
              </div>
            </div>

            <div className="finance-result">
              <span>Estimated monthly</span>
              <strong>{formatKES(Math.round(monthly))}</strong>
            </div>

            {loanSent ? (
              <div className="enquire-success" style={{ marginTop: '1rem' }}>
                Loan purchase request sent to {dealer.name}. They can follow up from their dealer
                portal.
              </div>
            ) : (
              <form className="loan-request-form" onSubmit={onLoanRequest}>
                <div className="field">
                  <label htmlFor="loan-partner">Preferred loan partner</label>
                  <select
                    id="loan-partner"
                    value={loanPartnerId}
                    onChange={(e) => setLoanPartnerId(e.target.value)}
                  >
                    {loanPartners.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid-2" style={{ marginTop: '0.75rem' }}>
                  <div className="field">
                    <label htmlFor="loan-name">Full name</label>
                    <input
                      id="loan-name"
                      required
                      value={loanName}
                      onChange={(e) => setLoanName(e.target.value)}
                      placeholder="Jane Wanjiku"
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="loan-phone">Phone</label>
                    <input
                      id="loan-phone"
                      required
                      value={loanPhone}
                      onChange={(e) => setLoanPhone(e.target.value)}
                      placeholder="+254 7.."
                    />
                  </div>
                </div>
                <button type="submit" className="btn btn-primary" style={{ marginTop: '0.85rem', width: '100%' }}>
                  Request to buy on loan
                </button>
              </form>
            )}

            <div className="finance-partners">
              {loanPartners.slice(0, 3).map((p) => (
                <Link
                  key={p.id}
                  to={`/loans?car=${car.id}&partner=${p.id}`}
                  className="finance-partner"
                >
                  <strong>
                    {p.logo ? (
                      <img src={p.logo} alt="" className="finance-partner-logo" />
                    ) : null}
                    {p.name}
                  </strong>
                  <span>
                    ★ {p.rating} · from {p.rateFrom}% · {p.minDepositPercent}% deposit
                  </span>
                </Link>
              ))}
            </div>
            <Link
              to={`/loans?car=${car.id}`}
              className="btn btn-ghost"
              style={{ marginTop: '1rem', width: '100%' }}
            >
              Compare all loan partners
            </Link>
          </div>
        </div>
      </div>

      <ReportAccountModal
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        targetType="Dealer"
        targetId={dealer.id}
        targetName={dealer.name}
        relatedListing={`${car.year} ${car.make} ${car.model}`}
      />
      <MessageDealerModal
        open={messageOpen}
        onClose={() => setMessageOpen(false)}
        dealerId={dealer.id}
        dealerName={dealer.name}
        carId={car.id}
        carLabel={`${car.year} ${car.make} ${car.model}`}
      />
    </section>
  )
}
