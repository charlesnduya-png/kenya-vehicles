import { type FormEvent, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  getCustomerIdentity,
  startOrContinueThread,
} from '../data/messages'
import './MessageDealerModal.css'

type Props = {
  open: boolean
  onClose: () => void
  dealerId: string
  dealerName: string
  carId?: string
  carLabel?: string
}

export function MessageDealerModal({
  open,
  onClose,
  dealerId,
  dealerName,
  carId,
  carLabel,
}: Props) {
  const identity = getCustomerIdentity()
  const [name, setName] = useState(identity?.name ?? '')
  const [phone, setPhone] = useState(identity?.phone ?? '')
  const [email, setEmail] = useState(identity?.email ?? '')
  const [text, setText] = useState(
    carLabel ? `Hi, I'm interested in the ${carLabel}. Is it still available?` : '',
  )
  const [doneId, setDoneId] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    const id = getCustomerIdentity()
    setName(id?.name ?? '')
    setPhone(id?.phone ?? '')
    setEmail(id?.email ?? '')
    setText(carLabel ? `Hi, I'm interested in the ${carLabel}. Is it still available?` : '')
    setDoneId(null)
  }, [open, carLabel])

  if (!open) return null

  function resetAndClose() {
    setDoneId(null)
    onClose()
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!text.trim()) return
    const thread = startOrContinueThread({
      dealerId,
      dealerName,
      carId,
      carLabel,
      customerName: name,
      customerPhone: phone,
      customerEmail: email,
      text,
    })
    setDoneId(thread.id)
  }

  return (
    <div className="msg-overlay" role="presentation" onClick={resetAndClose}>
      <div
        className="msg-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="msg-title"
        onClick={(e) => e.stopPropagation()}
      >
        {doneId ? (
          <div className="msg-done">
            <h2 id="msg-title">Message sent</h2>
            <p>
              Your text was sent to <strong>{dealerName}</strong>. You can keep chatting in your
              inbox.
            </p>
            <div className="msg-done-actions">
              <Link to={`/messages?thread=${doneId}`} className="btn btn-primary" onClick={onClose}>
                Open messages
              </Link>
              <button type="button" className="btn btn-ghost" onClick={resetAndClose}>
                Close
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={onSubmit}>
            <div className="msg-modal-head">
              <div>
                <p className="msg-eyebrow">Messages</p>
                <h2 id="msg-title">Text {dealerName}</h2>
                <p>
                  {carLabel
                    ? `About ${carLabel}`
                    : 'Ask about stock, viewing times, or paperwork'}
                </p>
              </div>
              <button type="button" className="msg-x" onClick={resetAndClose} aria-label="Close">
                ×
              </button>
            </div>

            <div className="grid-2">
              <div className="field">
                <label htmlFor="msg-name">Your name</label>
                <input
                  id="msg-name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jane Wanjiku"
                />
              </div>
              <div className="field">
                <label htmlFor="msg-phone">Phone</label>
                <input
                  id="msg-phone"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+254 7.."
                />
              </div>
            </div>

            <div className="field" style={{ marginTop: '0.75rem' }}>
              <label htmlFor="msg-email">Email</label>
              <input
                id="msg-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
              />
            </div>

            <div className="field" style={{ marginTop: '0.75rem' }}>
              <label htmlFor="msg-text">Message</label>
              <textarea
                id="msg-text"
                required
                rows={4}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Type your message…"
              />
            </div>

            <div className="msg-actions">
              <button type="button" className="btn btn-ghost" onClick={resetAndClose}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Send message
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
