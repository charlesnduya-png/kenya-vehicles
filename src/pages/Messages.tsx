import { type FormEvent, useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  getCustomerIdentity,
  getThread,
  getThreadsForCustomer,
  replyToThread,
  setCustomerIdentity,
  subscribeMessages,
  type MessageThread,
} from '../data/messages'
import './Messages.css'

export function Messages() {
  const [params, setParams] = useSearchParams()
  const [identity, setIdentity] = useState(() => getCustomerIdentity())
  const [threads, setThreads] = useState<MessageThread[]>(() =>
    identity ? getThreadsForCustomer(identity.phone) : [],
  )
  const [activeId, setActiveId] = useState(params.get('thread') ?? '')
  const [draft, setDraft] = useState('')
  const [lookupPhone, setLookupPhone] = useState(identity?.phone ?? '')
  const [lookupName, setLookupName] = useState(identity?.name ?? '')
  const [lookupEmail, setLookupEmail] = useState(identity?.email ?? '')
  const [showClaim, setShowClaim] = useState(() => !getCustomerIdentity())

  useEffect(() => {
    return subscribeMessages(() => {
      const id = getCustomerIdentity()
      setIdentity(id)
      setThreads(id ? getThreadsForCustomer(id.phone) : [])
      if (id) setShowClaim(false)
    })
  }, [])

  useEffect(() => {
    const fromUrl = params.get('thread')
    if (!fromUrl) return
    setActiveId(fromUrl)
    const thread = getThread(fromUrl)
    if (!thread) return
    if (!getCustomerIdentity()) {
      const next = {
        name: thread.customerName,
        phone: thread.customerPhone,
        email: thread.customerEmail,
      }
      setCustomerIdentity(next)
      setIdentity(next)
      setThreads(getThreadsForCustomer(next.phone))
      setShowClaim(false)
    }
  }, [params])

  const active = useMemo(() => {
    if (!activeId) return threads[0] ?? null
    return threads.find((t) => t.id === activeId) ?? getThread(activeId) ?? null
  }, [threads, activeId])

  function claimInbox(e: FormEvent) {
    e.preventDefault()
    const next = {
      name: lookupName.trim() || 'Customer',
      phone: lookupPhone.trim(),
      email: lookupEmail.trim() || `${lookupPhone.trim().replace(/\s/g, '')}@customer.local`,
    }
    if (!next.phone) return
    setCustomerIdentity(next)
    setIdentity(next)
    setThreads(getThreadsForCustomer(next.phone))
    setShowClaim(false)
  }

  function sendReply(e: FormEvent) {
    e.preventDefault()
    if (!active || !draft.trim()) return
    replyToThread(active.id, 'customer', draft)
    setDraft('')
    setActiveId(active.id)
    setParams({ thread: active.id })
  }

  return (
    <section className="section messages-page">
      <div className="container">
        <div className="messages-head">
          <div>
            <p className="eyebrow">Inbox</p>
            <h1>Messages</h1>
            <p>
              {identity
                ? `Chatting as ${identity.name} · ${identity.phone}`
                : 'No sign-in needed — message dealers from any car page, or open an inbox with your phone.'}
            </p>
          </div>
          <div className="messages-head-actions">
            {identity && !showClaim && (
              <button type="button" className="btn btn-ghost" onClick={() => setShowClaim(true)}>
                Switch phone
              </button>
            )}
            <Link to="/cars" className="btn btn-ghost">
              Browse cars
            </Link>
          </div>
        </div>

        {(showClaim || !identity) && (
          <form className="panel-card messages-claim-form messages-claim-inline" onSubmit={claimInbox}>
            <div>
              <strong>Open your inbox</strong>
              <p>Use the phone number you gave when messaging a dealer. No account login required.</p>
            </div>
            <div className="grid-2">
              <div className="field">
                <label htmlFor="claim-phone">Phone</label>
                <input
                  id="claim-phone"
                  required
                  value={lookupPhone}
                  onChange={(e) => setLookupPhone(e.target.value)}
                  placeholder="+254 7.."
                />
              </div>
              <div className="field">
                <label htmlFor="claim-name">Name</label>
                <input
                  id="claim-name"
                  value={lookupName}
                  onChange={(e) => setLookupName(e.target.value)}
                  placeholder="Jane Wanjiku"
                />
              </div>
            </div>
            <div className="field">
              <label htmlFor="claim-email">Email</label>
              <input
                id="claim-email"
                type="email"
                value={lookupEmail}
                onChange={(e) => setLookupEmail(e.target.value)}
                placeholder="you@email.com"
              />
            </div>
            <div className="messages-claim-actions">
              <button type="submit" className="btn btn-primary">
                Open inbox
              </button>
              {identity && (
                <button type="button" className="btn btn-ghost" onClick={() => setShowClaim(false)}>
                  Cancel
                </button>
              )}
            </div>
          </form>
        )}

        <div className="messages-shell panel-card">
          <aside className="messages-list">
            {threads.length === 0 && (
              <div className="messages-empty">
                No conversations yet.{' '}
                <Link to="/cars">Browse cars</Link> and tap <strong>Message dealer</strong> — no login
                needed.
              </div>
            )}
            {threads.map((thread) => (
              <button
                key={thread.id}
                type="button"
                className={`messages-list-item ${active?.id === thread.id ? 'is-active' : ''}`}
                onClick={() => {
                  setActiveId(thread.id)
                  setParams({ thread: thread.id })
                }}
              >
                <strong>{thread.dealerName}</strong>
                <span>{thread.carLabel ?? 'General chat'}</span>
                <em>{thread.messages[thread.messages.length - 1]?.text}</em>
              </button>
            ))}
          </aside>

          <div className="messages-chat">
            {!active ? (
              <div className="messages-empty">Select a conversation</div>
            ) : (
              <>
                <div className="messages-chat-head">
                  <div>
                    <strong>{active.dealerName}</strong>
                    <span>{active.carLabel ?? 'General chat'}</span>
                  </div>
                  {active.carId && (
                    <Link to={`/cars/${active.carId}`} className="btn btn-ghost">
                      View car
                    </Link>
                  )}
                </div>
                <div className="messages-stream">
                  {active.messages.map((m) => (
                    <div
                      key={m.id}
                      className={`messages-bubble ${m.sender === 'customer' ? 'is-me' : 'is-them'}`}
                    >
                      <p>{m.text}</p>
                      <time>{new Date(m.createdAt).toLocaleString()}</time>
                    </div>
                  ))}
                </div>
                <form className="messages-composer" onSubmit={sendReply}>
                  <input
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder="Type a message…"
                    required
                  />
                  <button type="submit" className="btn btn-primary">
                    Send
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
