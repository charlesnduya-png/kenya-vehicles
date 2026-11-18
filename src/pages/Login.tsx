import { type FormEvent, useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { getSession, homePathForSession, loginWithEmail } from '../data/auth'
import './Login.css'

export function Login() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

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

  return (
    <section className="section login-page">
      <div className="container login-layout">
        <div className="login-card panel-card">
          <p className="eyebrow">Kenya Vehicles</p>
          <h1>Sign in</h1>
          <p className="login-lead">Sign in to your Kenya Vehicles dealer or lender account.</p>

          <form onSubmit={onSubmit} className="login-form">
            <div className="field">
              <label htmlFor="login-email">Email</label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@company.co.ke"
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
            New yard or lender? <Link to="/join">Join Kenya Vehicles</Link>
          </p>
        </div>
      </div>
    </section>
  )
}
