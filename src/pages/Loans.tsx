import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { formatKES, getCar } from '../data/cars'
import { getDealer } from '../data/dealers'
import { submitEnquiry } from '../data/enquiries'
import {
  estimateMonthlyPayment,
  loanPartners,
  subscribeLoanPartners,
} from '../data/loans'
import './Loans.css'

export function Loans() {
  const [params] = useSearchParams()
  const linkedCar = getCar(params.get('car') ?? '')
  const linkedDealer = linkedCar ? getDealer(linkedCar.dealerId) : undefined
  const partnerFromUrl = params.get('partner')

  const [price, setPrice] = useState(linkedCar?.price ?? 2500000)
  const [deposit, setDeposit] = useState(20)
  const [months, setMonths] = useState(48)
  const [city, setCity] = useState(linkedCar?.city ?? 'Nairobi')
  const [applied, setApplied] = useState<string | null>(null)
  const [applyName, setApplyName] = useState('')
  const [applyPhone, setApplyPhone] = useState('')
  const [, setPartnerTick] = useState(0)

  useEffect(() => {
    if (linkedCar) {
      setPrice(linkedCar.price)
      setCity(linkedCar.city)
    }
  }, [linkedCar])

  useEffect(() => subscribeLoanPartners(() => setPartnerTick((n) => n + 1)), [])

  const estimates = useMemo(() => {
    return loanPartners
      .filter((p) => p.cities.includes(city))
      .map((p) => {
        const midRate = (p.rateFrom + p.rateTo) / 2
        const depositPct = Math.max(deposit, p.minDepositPercent)
        const monthly = estimateMonthlyPayment(
          price,
          depositPct,
          midRate,
          Math.min(months, p.maxTermMonths),
        )
        return { partner: p, monthly, depositPct, midRate }
      })
      .sort((a, b) => a.monthly - b.monthly)
  }, [price, deposit, months, city])

  function onApply(e: FormEvent, partnerId: string) {
    e.preventDefault()
    const partner = loanPartners.find((p) => p.id === partnerId)
    if (!partner) return

    const midRate = (partner.rateFrom + partner.rateTo) / 2
    const depositPct = Math.max(deposit, partner.minDepositPercent)
    const term = Math.min(months, partner.maxTermMonths)
    const monthly = estimateMonthlyPayment(price, depositPct, midRate, term)

    if (linkedCar && linkedDealer) {
      const carLabel = `${linkedCar.year} ${linkedCar.make} ${linkedCar.model}`
      submitEnquiry({
        type: 'Loan',
        dealerId: linkedDealer.id,
        dealerName: linkedDealer.name,
        carId: linkedCar.id,
        carLabel,
        carImage: linkedCar.images[0],
        carYear: linkedCar.year,
        carMake: linkedCar.make,
        carModel: linkedCar.model,
        carMileage: linkedCar.mileage,
        carCity: linkedCar.city,
        carPrice: linkedCar.price,
        customerName: applyName.trim(),
        customerPhone: applyPhone.trim(),
        message: `Applied for ${partner.name} financing to purchase ${carLabel}.`,
        loanPartnerId: partner.id,
        loanPartnerName: partner.name,
        depositPercent: depositPct,
        termMonths: term,
        estimatedMonthly: monthly,
      })
    }

    setApplied(partnerId)
  }

  return (
    <section className="section loans-page">
      <div className="container">
        <div className="loans-head fade-up">
          <div>
            <p className="eyebrow">Finance on Kenya Vehicles</p>
            <h1>Compare car loans while you shop</h1>
            <p>
              Banks, saccos, microfinance, and fintechs — all on Kenya Vehicles so you can fund a
              car from any dealer without shopping rates alone.
            </p>
            {linkedCar && linkedDealer && (
              <p className="loans-linked-car">
                Financing{' '}
                <Link to={`/cars/${linkedCar.id}`}>
                  {linkedCar.year} {linkedCar.make} {linkedCar.model}
                </Link>{' '}
                from {linkedDealer.name}. Your application is also sent to the yard as a loan
                enquiry.
              </p>
            )}
          </div>
          <Link to="/join#lenders" className="btn btn-ghost">
            Offer loans on Kenya Vehicles
          </Link>
        </div>

        <div className="loans-layout">
          <aside className="loans-calculator fade-up">
            <h2>Quick calculator</h2>
            <div className="field">
              <label htmlFor="car-price">Car price — {formatKES(price)}</label>
              <input
                id="car-price"
                type="range"
                min={500000}
                max={10000000}
                step={50000}
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                disabled={Boolean(linkedCar)}
              />
            </div>
            <div className="field">
              <label htmlFor="dep">Deposit {deposit}%</label>
              <input
                id="dep"
                type="range"
                min={10}
                max={50}
                value={deposit}
                onChange={(e) => setDeposit(Number(e.target.value))}
              />
            </div>
            <div className="field">
              <label htmlFor="term">Term {months} months</label>
              <input
                id="term"
                type="range"
                min={12}
                max={72}
                step={6}
                value={months}
                onChange={(e) => setMonths(Number(e.target.value))}
              />
            </div>
            <div className="field">
              <label htmlFor="city">Your city</label>
              <select id="city" value={city} onChange={(e) => setCity(e.target.value)}>
                {['Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret'].map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <p className="loans-calc-note">
              Estimates use each partner&apos;s mid-rate and minimum deposit rules. Final offers vary.
            </p>
          </aside>

          <div className="loans-list">
            {estimates.length === 0 ? (
              <div className="browse-empty">
                <h3>No partners in {city} yet</h3>
                <p>Try Nairobi or Mombasa, or invite a lender to join Kenya Vehicles.</p>
              </div>
            ) : (
              estimates.map(({ partner, monthly, depositPct, midRate }, i) => (
                <article
                  key={partner.id}
                  className={`loan-card fade-up fade-up-delay-${Math.min(i, 3)} ${
                    partnerFromUrl === partner.id ? 'is-highlighted' : ''
                  }`}
                >
                  <div className="loan-card-top">
                    <div className="loan-card-identity">
                      {partner.logo ? (
                        <img
                          src={partner.logo}
                          alt=""
                          className="loan-logo"
                          loading="lazy"
                        />
                      ) : (
                        <span
                          className="loan-dot"
                          style={{ background: partner.logoColor }}
                          aria-hidden="true"
                        />
                      )}
                      <div>
                        <h2>{partner.name}</h2>
                        <p className="loan-type">
                          {partner.type} · ★ {partner.rating} ({partner.reviewCount})
                        </p>
                      </div>
                    </div>
                    <div className="loan-monthly">
                      <span>Est. monthly</span>
                      <strong>{formatKES(Math.round(monthly))}</strong>
                    </div>
                  </div>
                  <p className="loan-highlight">{partner.highlight}</p>
                  <div className="loan-meta">
                    <span>
                      Rates {partner.rateFrom}%–{partner.rateTo}%
                    </span>
                    <span>From {depositPct}% deposit</span>
                    <span>Up to {partner.maxTermMonths} mo</span>
                    <span>Max {formatKES(partner.maxLoan)}</span>
                  </div>
                  <p className="loan-cities">Available in {partner.cities.join(' · ')}</p>

                  {applied === partner.id ? (
                    <div className="enquire-success">
                      Application started for {partner.name}.
                      {linkedDealer
                        ? ` ${linkedDealer.name} also received this as a loan purchase enquiry.`
                        : ' A loan officer will follow up.'}
                    </div>
                  ) : (
                    <form className="loan-apply" onSubmit={(e) => onApply(e, partner.id)}>
                      <div className="grid-2">
                        <div className="field">
                          <label htmlFor={`n-${partner.id}`}>Full name</label>
                          <input
                            id={`n-${partner.id}`}
                            required
                            placeholder="Your name"
                            value={applyName}
                            onChange={(e) => setApplyName(e.target.value)}
                          />
                        </div>
                        <div className="field">
                          <label htmlFor={`p-${partner.id}`}>Phone</label>
                          <input
                            id={`p-${partner.id}`}
                            required
                            placeholder="+254 7.."
                            value={applyPhone}
                            onChange={(e) => setApplyPhone(e.target.value)}
                          />
                        </div>
                      </div>
                      <button type="submit" className="btn btn-primary">
                        {linkedCar
                          ? `Request ${partner.name} for this car`
                          : `Apply with ${partner.name}`}
                      </button>
                      <p className="loan-mid">
                        Using ~{midRate.toFixed(1)}% for this estimate
                        {linkedDealer ? ` · Yard notified: ${linkedDealer.name}` : ''}
                      </p>
                    </form>
                  )}
                </article>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
