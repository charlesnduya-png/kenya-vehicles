import { type FormEvent, useState } from 'react'
import {
  reportReasons,
  submitReport,
  type ReportReason,
  type ReportTargetType,
} from '../data/reports'
import './ReportAccountModal.css'

type Props = {
  open: boolean
  onClose: () => void
  targetType: ReportTargetType
  targetId: string
  targetName: string
  relatedListing?: string
}

export function ReportAccountModal({
  open,
  onClose,
  targetType,
  targetId,
  targetName,
  relatedListing,
}: Props) {
  const [reason, setReason] = useState<ReportReason>('Fraud / scam')
  const [details, setDetails] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [done, setDone] = useState(false)

  if (!open) return null

  function resetAndClose() {
    setDone(false)
    setDetails('')
    setReason('Fraud / scam')
    onClose()
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    submitReport({
      targetType,
      targetId,
      targetName,
      reason,
      details: details.trim(),
      reporterName: name.trim(),
      reporterPhone: phone.trim(),
      reporterEmail: email.trim(),
      relatedListing,
    })
    setDone(true)
  }

  return (
    <div className="report-overlay" role="presentation" onClick={resetAndClose}>
      <div
        className="report-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="report-title"
        onClick={(e) => e.stopPropagation()}
      >
        {done ? (
          <div className="report-done">
            <h2 id="report-title">Report submitted</h2>
            <p>
              Thanks. Kenya Vehicles trust &amp; safety will review your report about{' '}
              <strong>{targetName}</strong>.
            </p>
            <button type="button" className="btn btn-primary" onClick={resetAndClose}>
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={onSubmit}>
            <div className="report-modal-head">
              <div>
                <p className="report-eyebrow">Trust &amp; safety</p>
                <h2 id="report-title">Report account</h2>
                <p>
                  Reporting <strong>{targetName}</strong> ({targetType.toLowerCase()})
                </p>
              </div>
              <button type="button" className="report-x" onClick={resetAndClose} aria-label="Close">
                ×
              </button>
            </div>

            <div className="field">
              <label htmlFor="report-reason">Reason</label>
              <select
                id="report-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value as ReportReason)}
                required
              >
                {reportReasons.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label htmlFor="report-details">What happened?</label>
              <textarea
                id="report-details"
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Share details so our team can investigate…"
                required
                rows={4}
              />
            </div>

            <div className="grid-2">
              <div className="field">
                <label htmlFor="report-name">Your name</label>
                <input
                  id="report-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="Jane Wanjiku"
                />
              </div>
              <div className="field">
                <label htmlFor="report-phone">Phone</label>
                <input
                  id="report-phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  placeholder="+254 7.."
                />
              </div>
            </div>

            <div className="field" style={{ marginTop: '0.75rem' }}>
              <label htmlFor="report-email">Email</label>
              <input
                id="report-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@email.com"
              />
            </div>

            <p className="report-note">
              False reports may lead to account restrictions. We keep your contact private from the
              reported party.
            </p>

            <div className="report-actions">
              <button type="button" className="btn btn-ghost" onClick={resetAndClose}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Submit report
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
