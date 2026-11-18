import { type FormEvent, useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
  DEMO_PASSWORD,
  getDealerAccounts,
  getLoanPartnerAccounts,
  getSession,
  homePathForSession,
  loginAsDealer,
  loginAsLoanPartner,
  loginWithEmail,
} from '../data/auth'
import './Login.css'

export function Login() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [email, setEmail] = useState('auto@equitybank.co.ke')
  const [password, setPassword] = useState(DEMO_PASSWORD)
  const [error, setError] = useState('')
  const dealers = getDealerAccounts()
  const lenders = getLoanPartnerAccounts()

  useEffect(() => {
    const session = getSession()
    if (session) navigate(homePathForSession(session), { replace: true })
  }, [navigate])

  function finish(session: NonNullable<ReturnType<typeof getSession>>) {
    const home = homePathForSession(session)
    const next = params.get('next')
    const allowed =
      next &&
      (next === home ||
        next.startsWith(`${home}/`) ||
        (session.role === 'Admin' && next.startsWith('/admin')) ||
        (session.role === 'Dealer' && next.startsWith('/dealer')) ||
        (session.role === 'Loan partner' && next.startsWith('/lender')))
    navigate(allowed ? next! : home, { replace: true })
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    const result = loginWithEmail(email, password)
    if (!result.ok) {
      setError(result.error)
      return
    }
    finish(result.session)
  }

  function quickDealer(dealerId: string) {
    const result = loginAsDealer(dealerId)
    if (!result.ok) {
      setError(result.error)
      return
    }
    finish(result.session)
  }

  function quickLender(loanPartnerId: string) {
    const result = loginAsLoanPartner(loanPartnerId)
    if (!result.ok) {
      setError(result.error)
      return
    }
    finish(result.session)
  }

  return (
    <section className="section login-page">
      <div className="container login-layout">
        <div className="login-card panel-card">
          <p className="eyebrow">Kenya Vehicles</p>
          <h1>Sign in</h1>
          <p className="login-lead">
            Dealers and loan agents manage leads here. Demo password for all accounts:{' '}
            <strong>{DEMO_PASSWORD}</strong>
          </p>

          <form onSubmit={onSubmit} className="login-form">
            <div className="field">
              <label htmlFor="login-email">Email</label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="auto@equitybank.co.ke"
              />
            </div>
            <div className="field">
              <label htmlFor="login-password">Password</label>
              <input
                id="login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && <p className="login-error">{error}</p>}
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
              Sign in
            </button>
          </form>

          <p className="login-alt">
            New yard or lender? <Link to="/join">Join Kenya Vehicles</Link> ·{' '}
            <Link to="/admin">Admin console</Link>
          </p>
        </div>

        <div className="login-side">
          <div className="login-dealers panel-card">
            <h2>Quick loan agent login</h2>
            <p>One click to enter a lender portal (demo).</p>
            <div className="login-dealer-list">
              {lenders.map((l) => (
                <button
                  key={l.loanPartnerId}
                  type="button"
                  className="login-dealer-btn"
                  onClick={() => quickLender(l.loanPartnerId)}
                >
                  <strong>{l.name}</strong>
                  <span>
                    {l.city} · {l.type}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="login-dealers panel-card">
            <h2>Quick dealer login</h2>
            <p>One click to enter a dealer portal (demo).</p>
            <div className="login-dealer-list">
              {dealers.map((d) => (
                <button
                  key={d.dealerId}
                  type="button"
                  className="login-dealer-btn"
                  onClick={() => quickDealer(d.dealerId)}
                >
                  <strong>{d.name}</strong>
                  <span>
                    {d.city} · {d.plan}
                    {d.verified ? ' · Verified' : ''}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
