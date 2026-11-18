import { useEffect, useRef, useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import { VerifiedBadge } from '../components/VerifiedBadge'
import type { AuthSession } from '../data/auth'
import { setDealerLogo, subscribeDealerLogos } from '../data/dealers'
import type { Dealer } from '../data/types'
import './DealerProfile.css'

type Ctx = { session: AuthSession; dealer?: Dealer }

const MAX_BYTES = 1.5 * 1024 * 1024

export function DealerProfile() {
  const { session, dealer } = useOutletContext<Ctx>()
  const [logo, setLogo] = useState(dealer?.logo)
  const [toast, setToast] = useState('')
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    return subscribeDealerLogos(() => {
      setLogo(dealer?.logo)
    })
  }, [dealer])

  useEffect(() => {
    setLogo(dealer?.logo)
  }, [dealer?.logo])

  function flash(message: string) {
    setToast(message)
    window.setTimeout(() => setToast(''), 2500)
  }

  function onFile(file: File | undefined) {
    setError('')
    if (!file || !dealer) return

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
      setDealerLogo(dealer.id, dataUrl)
      setLogo(dataUrl)
      flash('Yard logo uploaded')
    }
    reader.onerror = () => setError('Could not read that image. Try another file.')
    reader.readAsDataURL(file)
  }

  function removeLogo() {
    if (!dealer) return
    setDealerLogo(dealer.id, null)
    setLogo(undefined)
    if (inputRef.current) inputRef.current.value = ''
    flash('Yard logo removed')
  }

  return (
    <>
      {toast && <div className="admin-toast">{toast}</div>}

      <div className="admin-toolbar">
        <div>
          <h2>Yard profile</h2>
          <p style={{ margin: '0.2rem 0 0', color: '#64748b', fontSize: '0.85rem' }}>
            Public dealer details shown to Kenya Vehicles shoppers
          </p>
        </div>
        {dealer && (
          <Link to={`/dealers/${dealer.id}`} className="admin-btn admin-btn-ghost" target="_blank">
            View public page
          </Link>
        )}
      </div>

      <section className="admin-panel" style={{ marginBottom: '1rem' }}>
        <div className="admin-panel-head">
          <div>
            <h2>Yard logo</h2>
            <p>Shown on your dealer page, dealer directory, and portal</p>
          </div>
        </div>
        <div className="dealer-logo-upload">
          <div className="dealer-logo-preview">
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
              disabled={!dealer}
              onClick={() => inputRef.current?.click()}
            >
              {logo ? 'Replace logo' : 'Upload logo'}
            </button>
            {logo && (
              <button type="button" className="admin-btn admin-btn-ghost" onClick={removeLogo}>
                Remove logo
              </button>
            )}
            <p>
              Square PNG or JPG works best. Max 1.5 MB.
            </p>
            {error && <p className="dealer-logo-error">{error}</p>}
          </div>
        </div>
      </section>

      <section className="admin-panel">
        <div className="admin-panel-head">
          <div>
            <h2 className="with-verified">
              <span>{session.name}</span>
              {dealer?.verified && <VerifiedBadge title="Verified dealer" size={16} />}
            </h2>
            <p>{session.email}</p>
          </div>
          <span className={`admin-pill ${dealer?.verified ? 'ok' : 'warn'}`}>
            {dealer?.verified ? 'Verified' : 'Pending'}
          </span>
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <tbody>
              <tr>
                <td style={{ width: 180 }}>
                  <strong>Phone</strong>
                </td>
                <td>{dealer?.phone ?? '—'}</td>
              </tr>
              <tr>
                <td>
                  <strong>Location</strong>
                </td>
                <td>{dealer ? `${dealer.city}, ${dealer.county}` : session.city}</td>
              </tr>
              <tr>
                <td>
                  <strong>Specialty</strong>
                </td>
                <td>{dealer?.specialty ?? '—'}</td>
              </tr>
              <tr>
                <td>
                  <strong>Years active</strong>
                </td>
                <td>{dealer?.yearsActive ?? '—'}</td>
              </tr>
              <tr>
                <td>
                  <strong>Bio</strong>
                </td>
                <td>{dealer?.bio ?? '—'}</td>
              </tr>
              <tr>
                <td>
                  <strong>Plan</strong>
                </td>
                <td>{session.plan ?? 'Dealer'}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </>
  )
}
