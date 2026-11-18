import { type FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { findAccountByEmail, hydrateRegisteredPartners } from '../data/partnerRegistry'
import { resetAccountPassword } from '../data/auth'
import { sendVerificationCode, verifyEmailCode } from '../lib/mailApi'
import './Login.css'

type Step = 'email' | 'code' | 'password' | 'done'

const PURPOSE = 'reset-password'

export function ForgotPassword() {
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  async function sendCode() {
    setError('')
    setInfo('')
    hydrateRegisteredPartners()
    const account = findAccountByEmail(email)
    if (!account) {
      setError('No account found for that email.')
      return
    }
    if (account.status === 'Suspended') {
      setError('This account is suspended. Contact support.')
      return
    }
    setBusy(true)
    try {
      await sendVerificationCode(email.trim(), PURPOSE)
      setStep('code')
      setInfo('We sent a 6-digit code to your email. Enter it below.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send reset code.')
    } finally {
      setBusy(false)
    }
  }

  async function onSendCode(e: FormEvent) {
    e.preventDefault()
    await sendCode()
  }

  async function onVerifyCode(e: FormEvent) {
    e.preventDefault()
    setError('')
    setInfo('')
    setBusy(true)
    try {
      await verifyEmailCode(email.trim(), code.trim(), PURPOSE)
      setStep('password')
      setInfo('Code verified. Choose a new password.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not verify that code.')
    } finally {
      setBusy(false)
    }
  }

  function onSetPassword(e: FormEvent) {
    e.preventDefault()
    setError('')
    if (password.trim().length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    const result = resetAccountPassword(email, password)
    if (!result.ok) {
      setError(result.error)
      return
    }
    setStep('done')
    window.setTimeout(() => navigate('/login', { replace: true }), 1600)
  }

  return (
    <section className="section login-page">
      <div className="container login-layout">
        <div className="login-card panel-card">
          <p className="eyebrow">Kenya Vehicles</p>
          <h1>Reset password</h1>
          <p className="login-lead">
            Enter the email for your dealer or lender account. We will send a code so you can set a
            new password.
          </p>

          {step === 'email' && (
            <form onSubmit={onSendCode} className="login-form">
              <div className="field">
                <label htmlFor="reset-email">Email</label>
                <input
                  id="reset-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@company.co.ke"
                  autoComplete="email"
                />
              </div>
              {error && <p className="login-error">{error}</p>}
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={busy}>
                {busy ? 'Sending…' : 'Send reset code'}
              </button>
            </form>
          )}

          {step === 'code' && (
            <form onSubmit={onVerifyCode} className="login-form">
              <div className="field">
                <label htmlFor="reset-code">Verification code</label>
                <input
                  id="reset-code"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  required
                  placeholder="6-digit code"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                />
              </div>
              {error && <p className="login-error">{error}</p>}
              {info && !error && <p className="login-info">{info}</p>}
              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%' }}
                disabled={busy || code.trim().length !== 6}
              >
                {busy ? 'Verifying…' : 'Verify code'}
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                style={{ width: '100%' }}
                disabled={busy}
                onClick={() => void sendCode()}
              >
                Resend code
              </button>
            </form>
          )}

          {step === 'password' && (
            <form onSubmit={onSetPassword} className="login-form">
              <div className="field">
                <label htmlFor="reset-password">New password</label>
                <input
                  id="reset-password"
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
                <label htmlFor="reset-confirm">Confirm password</label>
                <input
                  id="reset-confirm"
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  placeholder="Repeat password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
              {error && <p className="login-error">{error}</p>}
              {info && !error && <p className="login-info">{info}</p>}
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                Save new password
              </button>
            </form>
          )}

          {step === 'done' && (
            <p className="login-info" style={{ marginTop: '1rem' }}>
              Password updated. Taking you to sign in…
            </p>
          )}

          <p className="login-alt">
            Remembered it? <Link to="/login">Back to sign in</Link>
          </p>
        </div>
      </div>
    </section>
  )
}
