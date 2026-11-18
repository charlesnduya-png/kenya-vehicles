import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { homePathForSession, setSession } from '../data/auth'
import {
  registerDealerAccount,
  registerLenderAccount,
} from '../data/partnerRegistry'
import { sendVerificationCode, verifyEmailCode } from '../lib/mailApi'
import './Join.css'

type Tab = 'dealer' | 'lender'

function initialTab(): Tab {
  if (typeof window === 'undefined') return 'dealer'
  if (window.location.hash === '#lenders') return 'lender'
  return 'dealer'
}

export function Join() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>(initialTab)
  const [submitted, setSubmitted] = useState(false)
  const [institutionType, setInstitutionType] = useState('Bank')

  const [biz, setBiz] = useState('')
  const [city, setCity] = useState('')
  const [contact, setContact] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [notes, setNotes] = useState('')
  const [code, setCode] = useState('')
  const [codeSent, setCodeSent] = useState(false)
  const [emailVerified, setEmailVerified] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [createdPath, setCreatedPath] = useState('')

  function resetVerification() {
    setCode('')
    setCodeSent(false)
    setEmailVerified(false)
    setError('')
    setInfo('')
  }

  async function onSendCode() {
    setError('')
    setInfo('')
    const trimmed = email.trim()
    if (!trimmed) {
      setError('Enter your work email first.')
      return
    }
    setBusy(true)
    try {
      await sendVerificationCode(trimmed, `join-${tab}`)
      setCodeSent(true)
      setEmailVerified(false)
      setCode('')
      setInfo('We sent a 6-digit code to your email. Enter it below to continue.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send verification code.')
    } finally {
      setBusy(false)
    }
  }

  async function onVerifyCode() {
    setError('')
    setInfo('')
    setBusy(true)
    try {
      await verifyEmailCode(email.trim(), code.trim(), `join-${tab}`)
      setEmailVerified(true)
      setInfo('Email verified. You can create your account.')
    } catch (err) {
      setEmailVerified(false)
      setError(err instanceof Error ? err.message : 'Could not verify that code.')
    } finally {
      setBusy(false)
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    if (!emailVerified) {
      setError('Verify your email with the code we sent before submitting.')
      return
    }
    if (password.trim().length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    if (tab === 'dealer') {
      const result = registerDealerAccount({
        businessName: biz,
        city,
        contactName: contact,
        phone,
        email,
        password,
        notes,
      })
      if (!result.ok) {
        setError(result.error)
        return
      }
      const session = {
        accountId: result.account.id,
        name: result.account.name,
        email: result.account.email,
        role: 'Dealer' as const,
        city: result.account.city,
        plan: 'Dealer',
        dealerId: result.dealer.id,
      }
      setSession(session)
      setCreatedPath(homePathForSession(session))
      setSubmitted(true)
      window.setTimeout(() => navigate('/dealer'), 1200)
      return
    }

    const result = registerLenderAccount({
      businessName: biz,
      city,
      contactName: contact,
      phone,
      email,
      password,
      institutionType,
      notes,
    })
    if (!result.ok) {
      setError(result.error)
      return
    }
    const session = {
      accountId: result.account.id,
      name: result.account.name,
      email: result.account.email,
      role: 'Loan partner' as const,
      city: result.account.city,
      plan: 'Lender',
      loanPartnerId: result.partner.id,
    }
    setSession(session)
    setCreatedPath(homePathForSession(session))
    setSubmitted(true)
    window.setTimeout(() => navigate('/lender'), 1200)
  }

  const title = tab === 'dealer' ? 'Create dealer account' : 'Create lender account'

  return (
    <section className="section join-page">
      <div className="container">
        <div className="join-head fade-up">
          <p className="eyebrow">Grow with Kenya Vehicles</p>
          <h1>Dealers &amp; lenders — nationwide</h1>
          <p>
            Create your Kenya Vehicles account to list stock, manage your yard or lending desk, and
            reach buyers across Kenya.
          </p>
        </div>

        <div className="join-tabs fade-up">
          <button
            type="button"
            className={tab === 'dealer' ? 'is-active' : undefined}
            onClick={() => {
              setTab('dealer')
              setSubmitted(false)
              resetVerification()
            }}
          >
            Dealer
          </button>
          <button
            type="button"
            id="lenders"
            className={tab === 'lender' ? 'is-active' : undefined}
            onClick={() => {
              setTab('lender')
              setSubmitted(false)
              resetVerification()
            }}
          >
            Lender
          </button>
        </div>

        <div className="join-layout">
          <div className="join-benefits fade-up">
            {tab === 'dealer' ? (
              <>
                <h2>Why dealers join</h2>
                <ul>
                  <li>One account for yards and brokers</li>
                  <li>List sale and hire cars from your portal</li>
                  <li>Reach buyers looking across Kenya</li>
                  <li>Get direct enquiries on your stock</li>
                </ul>
              </>
            ) : (
              <>
                <h2>Why lenders join</h2>
                <ul>
                  <li>Meet buyers at the moment they pick a car</li>
                  <li>Partner with dealers for cleaner collateral</li>
                  <li>Show rates, deposit rules, and cities you serve</li>
                  <li>Capture applications alongside marketplace traffic</li>
                </ul>
              </>
            )}
          </div>

          <form className="join-form fade-up fade-up-delay-1" onSubmit={onSubmit}>
            <h2>{title}</h2>
            {submitted ? (
              <div className="enquire-success">
                {tab === 'dealer' ? (
                  <>
                    Dealer account created. Opening your portal. Use this email and the password you
                    chose to sign in later
                    {createdPath ? (
                      <>
                        . <Link to={createdPath}>Go to portal</Link>
                      </>
                    ) : null}
                  </>
                ) : (
                  <>
                    Lender account created. Opening your portal. Use this email and the password you
                    chose to sign in later
                    {createdPath ? (
                      <>
                        . <Link to={createdPath}>Go to portal</Link>
                      </>
                    ) : null}
                  </>
                )}
              </div>
            ) : (
              <>
                <div className="grid-2">
                  <div className="field">
                    <label htmlFor="biz">Business / trade name</label>
                    <input
                      id="biz"
                      required
                      placeholder="Your company"
                      value={biz}
                      onChange={(e) => setBiz(e.target.value)}
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="city">City</label>
                    <input
                      id="city"
                      required
                      placeholder="Nairobi"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid-2" style={{ marginTop: '0.85rem' }}>
                  <div className="field">
                    <label htmlFor="contact">Contact person</label>
                    <input
                      id="contact"
                      required
                      placeholder="Full name"
                      value={contact}
                      onChange={(e) => setContact(e.target.value)}
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="phone">Phone</label>
                    <input
                      id="phone"
                      required
                      placeholder="+254 7.."
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                </div>
                <div className="field" style={{ marginTop: '0.85rem' }}>
                  <label htmlFor="email">Work email</label>
                  <div className="join-email-row">
                    <input
                      id="email"
                      type="email"
                      required
                      placeholder="you@company.co.ke"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value)
                        resetVerification()
                      }}
                      disabled={emailVerified}
                    />
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={onSendCode}
                      disabled={busy || emailVerified}
                    >
                      {codeSent && !emailVerified ? 'Resend code' : 'Send code'}
                    </button>
                  </div>
                </div>

                {codeSent && !emailVerified && (
                  <div className="field" style={{ marginTop: '0.85rem' }}>
                    <label htmlFor="code">Verification code</label>
                    <div className="join-email-row">
                      <input
                        id="code"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        pattern="[0-9]{6}"
                        maxLength={6}
                        required
                        placeholder="6-digit code"
                        value={code}
                        onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      />
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={onVerifyCode}
                        disabled={busy || code.trim().length !== 6}
                      >
                        Verify
                      </button>
                    </div>
                  </div>
                )}

                {emailVerified && (
                  <p className="join-verify-ok">Email verified — you can create this account.</p>
                )}

                <div className="grid-2" style={{ marginTop: '0.85rem' }}>
                  <div className="field">
                    <label htmlFor="password">Password</label>
                    <input
                      id="password"
                      type="password"
                      required
                      minLength={8}
                      autoComplete="new-password"
                      placeholder="At least 8 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="confirm-password">Confirm password</label>
                    <input
                      id="confirm-password"
                      type="password"
                      required
                      minLength={8}
                      autoComplete="new-password"
                      placeholder="Repeat password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                </div>

                {tab === 'lender' && (
                  <div className="field" style={{ marginTop: '0.85rem' }}>
                    <label htmlFor="type">Institution type</label>
                    <select
                      id="type"
                      value={institutionType}
                      onChange={(e) => setInstitutionType(e.target.value)}
                    >
                      <option>Bank</option>
                      <option>Sacco</option>
                      <option>Microfinance</option>
                      <option>Fintech</option>
                    </select>
                  </div>
                )}

                <div className="field" style={{ marginTop: '0.85rem' }}>
                  <label htmlFor="notes">Anything we should know?</label>
                  <textarea
                    id="notes"
                    placeholder={
                      tab === 'dealer'
                        ? 'Areas you cover, brands you sell…'
                        : 'Branches, typical loan sizes…'
                    }
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>

                {error && <p className="join-error">{error}</p>}
                {info && !error && <p className="join-info">{info}</p>}

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ marginTop: '1.1rem' }}
                  disabled={busy || !emailVerified}
                >
                  {tab === 'dealer' ? 'Create dealer account' : 'Create lender account'}
                </button>
              </>
            )}
          </form>
        </div>
      </div>
    </section>
  )
}
