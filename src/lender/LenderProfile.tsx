import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import type { AuthSession } from '../data/auth'
import { formatKES } from '../data/cars'
import {
  getLoanPartner,
  setLoanPartnerLogo,
  subscribeLoanPartners,
  updateLoanPartnerContact,
  updateLoanPartnerRating,
  updateLoanPartnerTerms,
} from '../data/loans'
import type { LoanPartner } from '../data/types'
import '../dealer/DealerProfile.css'

type Ctx = { session: AuthSession; partner?: LoanPartner }

const MAX_BYTES = 1.5 * 1024 * 1024

export function LenderProfile() {
  const { session } = useOutletContext<Ctx>()
  const [partner, setPartner] = useState(() =>
    session.loanPartnerId ? getLoanPartner(session.loanPartnerId) : undefined,
  )
  const [logo, setLogo] = useState(partner?.logo)
  const [rating, setRating] = useState(String(partner?.rating ?? 4.5))
  const [reviewCount, setReviewCount] = useState(String(partner?.reviewCount ?? 0))
  const [rateFrom, setRateFrom] = useState(String(partner?.rateFrom ?? 12))
  const [rateTo, setRateTo] = useState(String(partner?.rateTo ?? 16))
  const [minDeposit, setMinDeposit] = useState(String(partner?.minDepositPercent ?? 20))
  const [maxLoan, setMaxLoan] = useState(String(partner?.maxLoan ?? 5000000))
  const [maxTerm, setMaxTerm] = useState(String(partner?.maxTermMonths ?? 48))
  const [highlight, setHighlight] = useState(partner?.highlight ?? '')
  const [phone, setPhone] = useState(partner?.phone ?? '')
  const [email, setEmail] = useState(partner?.email ?? '')
  const [contactName, setContactName] = useState(partner?.contactName ?? '')
  const [toast, setToast] = useState('')
  const [error, setError] = useState('')
  const [ratingError, setRatingError] = useState('')
  const [termsError, setTermsError] = useState('')
  const [contactError, setContactError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  function syncFromPartner(next?: LoanPartner) {
    setPartner(next)
    setLogo(next?.logo)
    setRating(String(next?.rating ?? 4.5))
    setReviewCount(String(next?.reviewCount ?? 0))
    setRateFrom(String(next?.rateFrom ?? 12))
    setRateTo(String(next?.rateTo ?? 16))
    setMinDeposit(String(next?.minDepositPercent ?? 20))
    setMaxLoan(String(next?.maxLoan ?? 5000000))
    setMaxTerm(String(next?.maxTermMonths ?? 48))
    setHighlight(next?.highlight ?? '')
    setPhone(next?.phone ?? '')
    setEmail(next?.email ?? '')
    setContactName(next?.contactName ?? '')
  }

  useEffect(() => {
    if (!session.loanPartnerId) return
    const refresh = () => syncFromPartner(getLoanPartner(session.loanPartnerId!))
    refresh()
    return subscribeLoanPartners(refresh)
  }, [session.loanPartnerId])

  function flash(message: string) {
    setToast(message)
    window.setTimeout(() => setToast(''), 2500)
  }

  function onFile(file: File | undefined) {
    setError('')
    if (!file || !partner) return

    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file (PNG, JPG, or WebP).')
      return
    }
    if (file.size > MAX_BYTES) {
      setError('Logo must be under 1.5 MB.')
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = String(reader.result)
      setLoanPartnerLogo(partner.id, dataUrl)
      setLogo(dataUrl)
      flash('Partner logo uploaded')
    }
    reader.onerror = () => setError('Could not read that image. Try another file.')
    reader.readAsDataURL(file)
  }

  function removeLogo() {
    if (!partner) return
    setLoanPartnerLogo(partner.id, null)
    setLogo(undefined)
    if (inputRef.current) inputRef.current.value = ''
    flash('Partner logo removed')
  }

  function onSaveRating(e: FormEvent) {
    e.preventDefault()
    if (!partner) return
    setRatingError('')
    const nextRating = Number(rating)
    const nextReviews = Number(reviewCount)
    if (!Number.isFinite(nextRating) || nextRating < 1 || nextRating > 5) {
      setRatingError('Rating must be between 1.0 and 5.0.')
      return
    }
    if (!Number.isFinite(nextReviews) || nextReviews < 0) {
      setRatingError('Review count must be zero or higher.')
      return
    }
    updateLoanPartnerRating(partner.id, nextRating, nextReviews)
    setRating(String(Math.min(5, Math.max(1, Math.round(nextRating * 10) / 10))))
    setReviewCount(String(Math.max(0, Math.round(nextReviews))))
    flash('Rating updated')
  }

  function onSaveTerms(e: FormEvent) {
    e.preventDefault()
    if (!partner) return
    setTermsError('')

    const nextFrom = Number(rateFrom)
    const nextTo = Number(rateTo)
    const nextDeposit = Number(minDeposit)
    const nextMaxLoan = Number(String(maxLoan).replace(/[^\d]/g, ''))
    const nextTerm = Number(maxTerm)

    if (!Number.isFinite(nextFrom) || !Number.isFinite(nextTo) || nextFrom < 1 || nextTo > 45) {
      setTermsError('Interest rates must be between 1% and 45%.')
      return
    }
    if (nextTo < nextFrom) {
      setTermsError('Rate “to” must be equal to or higher than rate “from”.')
      return
    }
    if (!Number.isFinite(nextDeposit) || nextDeposit < 0 || nextDeposit > 80) {
      setTermsError('Minimum deposit must be between 0% and 80%.')
      return
    }
    if (!Number.isFinite(nextMaxLoan) || nextMaxLoan < 100000) {
      setTermsError('Max loan must be at least KES 100,000.')
      return
    }
    if (!Number.isFinite(nextTerm) || nextTerm < 6 || nextTerm > 120) {
      setTermsError('Max term must be between 6 and 120 months.')
      return
    }

    updateLoanPartnerTerms(partner.id, {
      rateFrom: nextFrom,
      rateTo: nextTo,
      minDepositPercent: nextDeposit,
      maxLoan: nextMaxLoan,
      maxTermMonths: nextTerm,
      highlight,
    })
    flash('Loan terms updated — live on the public loans page')
  }

  function onSaveContact(e: FormEvent) {
    e.preventDefault()
    if (!partner) return
    setContactError('')
    if (!phone.trim() || !email.trim()) {
      setContactError('Phone and email are required so dealers can reach you.')
      return
    }
    updateLoanPartnerContact(partner.id, {
      phone,
      email,
      contactName,
    })
    flash('Contact details updated — dealers can call you from enquiries')
  }

  return (
    <>
      {toast && <div className="admin-toast">{toast}</div>}

      <div className="admin-toolbar">
        <div>
          <h2>Partner profile</h2>
          <p style={{ margin: '0.2rem 0 0', color: '#64748b', fontSize: '0.85rem' }}>
            Edit logo, contact for dealers, rates, deposit, and loan limits
          </p>
        </div>
        <Link to="/loans" className="admin-btn admin-btn-ghost" target="_blank">
          View public loans page
        </Link>
      </div>

      <section className="admin-panel" style={{ marginBottom: '1rem' }}>
        <div className="admin-panel-head">
          <div>
            <h2>Partner logo</h2>
            <p>Shown on the loans page, car finance cards, and your portal</p>
          </div>
        </div>
        <div className="dealer-logo-upload">
          <div
            className="dealer-logo-preview"
            style={!logo ? { background: partner?.logoColor ?? '#0f766e', color: '#fff' } : undefined}
          >
            {logo ? (
              <img src={logo} alt={`${session.name} logo`} />
            ) : (
              <span>{session.name.slice(0, 1).toUpperCase()}</span>
            )}
          </div>
          <div className="dealer-logo-actions">
            <input
              ref={inputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              hidden
              onChange={(e) => onFile(e.target.files?.[0])}
            />
            <button
              type="button"
              className="admin-btn admin-btn-primary"
              disabled={!partner}
              onClick={() => inputRef.current?.click()}
            >
              {logo ? 'Replace logo' : 'Upload logo'}
            </button>
            {logo && (
              <button type="button" className="admin-btn admin-btn-ghost" onClick={removeLogo}>
                Remove logo
              </button>
            )}
            <p>Square PNG or JPG works best. Max 1.5 MB.</p>
            {error && <p className="dealer-logo-error">{error}</p>}
          </div>
        </div>
      </section>

      <section className="admin-panel" style={{ marginBottom: '1rem' }}>
        <div className="admin-panel-head">
          <div>
            <h2>Loan terms</h2>
            <p>Minimum deposit, interest rates, max loan, and term — editable anytime</p>
          </div>
        </div>
        <form onSubmit={onSaveTerms} style={{ padding: '0 1.2rem 1.2rem' }}>
          <div className="grid-2">
            <div className="field">
              <label htmlFor="rate-from">Interest rate from (% p.a.)</label>
              <input
                id="rate-from"
                type="number"
                min={1}
                max={40}
                step={0.1}
                required
                value={rateFrom}
                onChange={(e) => setRateFrom(e.target.value)}
                disabled={!partner}
              />
            </div>
            <div className="field">
              <label htmlFor="rate-to">Interest rate to (% p.a.)</label>
              <input
                id="rate-to"
                type="number"
                min={1}
                max={45}
                step={0.1}
                required
                value={rateTo}
                onChange={(e) => setRateTo(e.target.value)}
                disabled={!partner}
              />
            </div>
          </div>

          <div className="grid-2" style={{ marginTop: '0.85rem' }}>
            <div className="field">
              <label htmlFor="min-deposit">Minimum deposit (%)</label>
              <input
                id="min-deposit"
                type="number"
                min={0}
                max={80}
                step={1}
                required
                value={minDeposit}
                onChange={(e) => setMinDeposit(e.target.value)}
                disabled={!partner}
              />
            </div>
            <div className="field">
              <label htmlFor="max-term">Max term (months)</label>
              <input
                id="max-term"
                type="number"
                min={6}
                max={120}
                step={6}
                required
                value={maxTerm}
                onChange={(e) => setMaxTerm(e.target.value)}
                disabled={!partner}
              />
            </div>
          </div>

          <div className="field" style={{ marginTop: '0.85rem' }}>
            <label htmlFor="max-loan">Maximum loan (KES)</label>
            <input
              id="max-loan"
              inputMode="numeric"
              required
              value={maxLoan}
              onChange={(e) => setMaxLoan(e.target.value)}
              disabled={!partner}
              placeholder="e.g. 10000000"
            />
            {partner && (
              <p style={{ margin: '0.35rem 0 0', color: '#64748b', fontSize: '0.8rem' }}>
                Currently published as {formatKES(partner.maxLoan)}
              </p>
            )}
          </div>

          <div className="field" style={{ marginTop: '0.85rem' }}>
            <label htmlFor="highlight">Public highlight</label>
            <input
              id="highlight"
              value={highlight}
              onChange={(e) => setHighlight(e.target.value)}
              disabled={!partner}
              placeholder="Short line buyers see on your loan card"
            />
          </div>

          {termsError && <p className="dealer-logo-error">{termsError}</p>}
          <button
            type="submit"
            className="admin-btn admin-btn-primary"
            style={{ marginTop: '0.85rem' }}
            disabled={!partner}
          >
            Save loan terms
          </button>
        </form>
      </section>

      <section className="admin-panel" style={{ marginBottom: '1rem' }}>
        <div className="admin-panel-head">
          <div>
            <h2>Dealer contact details</h2>
            <p>Shown on yard loan enquiries so dealers can call or email your desk</p>
          </div>
        </div>
        <form onSubmit={onSaveContact} style={{ padding: '0 1.2rem 1.2rem' }}>
          <div className="grid-2">
            <div className="field">
              <label htmlFor="contact-name">Desk / agent name</label>
              <input
                id="contact-name"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                disabled={!partner}
                placeholder="Auto loans desk"
              />
            </div>
            <div className="field">
              <label htmlFor="contact-phone">Phone</label>
              <input
                id="contact-phone"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={!partner}
                placeholder="+254 7.."
              />
            </div>
            <div className="field">
              <label htmlFor="contact-email">Email</label>
              <input
                id="contact-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={!partner}
                placeholder="loans@partner.co.ke"
              />
            </div>
          </div>
          {contactError && <p className="dealer-logo-error">{contactError}</p>}
          <button
            type="submit"
            className="admin-btn admin-btn-primary"
            style={{ marginTop: '0.85rem' }}
            disabled={!partner}
          >
            Save contact details
          </button>
        </form>
      </section>

      <section className="admin-panel" style={{ marginBottom: '1rem' }}>
        <div className="admin-panel-head">
          <div>
            <h2>Public rating</h2>
            <p>Edit the star rating and review count shown to buyers</p>
          </div>
        </div>
        <form onSubmit={onSaveRating} style={{ padding: '0 1.2rem 1.2rem' }}>
          <div className="grid-2">
            <div className="field">
              <label htmlFor="lender-rating">Rating (1.0 – 5.0)</label>
              <input
                id="lender-rating"
                type="number"
                min={1}
                max={5}
                step={0.1}
                required
                value={rating}
                onChange={(e) => setRating(e.target.value)}
                disabled={!partner}
              />
            </div>
            <div className="field">
              <label htmlFor="lender-reviews">Review count</label>
              <input
                id="lender-reviews"
                type="number"
                min={0}
                step={1}
                required
                value={reviewCount}
                onChange={(e) => setReviewCount(e.target.value)}
                disabled={!partner}
              />
            </div>
          </div>
          {ratingError && <p className="dealer-logo-error">{ratingError}</p>}
          <button
            type="submit"
            className="admin-btn admin-btn-primary"
            style={{ marginTop: '0.85rem' }}
            disabled={!partner}
          >
            Save rating
          </button>
        </form>
      </section>

      <section className="admin-panel" style={{ padding: '1.2rem' }}>
        <div className="admin-grid-kpi" style={{ marginBottom: '1rem' }}>
          <article className="admin-kpi">
            <span>Partner</span>
            <strong style={{ fontSize: '1.05rem' }}>{session.name}</strong>
            <em>{session.email}</em>
          </article>
          <article className="admin-kpi">
            <span>Live rating</span>
            <strong style={{ fontSize: '1.05rem' }}>★ {partner?.rating ?? '—'}</strong>
            <em>{partner?.reviewCount ?? 0} reviews</em>
          </article>
          <article className="admin-kpi">
            <span>Live rates</span>
            <strong style={{ fontSize: '1.05rem' }}>
              {partner ? `${partner.rateFrom}%–${partner.rateTo}%` : '—'}
            </strong>
            <em>From {partner?.minDepositPercent ?? '—'}% deposit</em>
          </article>
          <article className="admin-kpi">
            <span>Max loan</span>
            <strong style={{ fontSize: '1.05rem' }}>
              {partner ? formatKES(partner.maxLoan) : '—'}
            </strong>
            <em>Up to {partner?.maxTermMonths ?? '—'} months</em>
          </article>
        </div>

        {partner ? (
          <dl style={{ display: 'grid', gap: '0.85rem', margin: 0 }}>
            <div>
              <dt style={{ color: '#64748b', fontSize: '0.8rem' }}>Highlight</dt>
              <dd style={{ margin: '0.2rem 0 0', fontWeight: 600 }}>{partner.highlight}</dd>
            </div>
            <div>
              <dt style={{ color: '#64748b', fontSize: '0.8rem' }}>Cities</dt>
              <dd style={{ margin: '0.2rem 0 0' }}>{partner.cities.join(' · ')}</dd>
            </div>
            <div>
              <dt style={{ color: '#64748b', fontSize: '0.8rem' }}>Dealer contact</dt>
              <dd style={{ margin: '0.2rem 0 0' }}>
                {partner.contactName ? `${partner.contactName} · ` : ''}
                {partner.phone} · {partner.email}
              </dd>
            </div>
          </dl>
        ) : (
          <div className="admin-empty">Partner catalogue entry not linked yet.</div>
        )}
      </section>
    </>
  )
}
