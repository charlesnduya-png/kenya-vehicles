import { type FormEvent, useEffect, useMemo, useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import type { AuthSession } from '../data/auth'
import {
  getThreadsForDealer,
  replyToThread,
  subscribeMessages,
  type MessageThread,
} from '../data/messages'
import type { Dealer } from '../data/types'

type Ctx = { session: AuthSession; dealer?: Dealer }

export function DealerMessages() {
  const { session } = useOutletContext<Ctx>()
  const [threads, setThreads] = useState<MessageThread[]>(() =>
    session.dealerId ? getThreadsForDealer(session.dealerId) : [],
  )
  const [activeId, setActiveId] = useState('')
  const [draft, setDraft] = useState('')

  useEffect(() => {
    if (!session.dealerId) return
    return subscribeMessages(() => setThreads(getThreadsForDealer(session.dealerId!)))
  }, [session.dealerId])

  const active = useMemo(
    () => threads.find((t) => t.id === activeId) ?? threads[0] ?? null,
    [threads, activeId],
  )

  function sendReply(e: FormEvent) {
    e.preventDefault()
    if (!active || !draft.trim()) return
    replyToThread(active.id, 'dealer', draft)
    setDraft('')
    setActiveId(active.id)
  }

  return (
    <>
      <div className="admin-toolbar">
        <div>
          <h2>Customer messages</h2>
          <p style={{ margin: '0.2rem 0 0', color: '#64748b', fontSize: '0.85rem' }}>
            Text chats from Kenya Vehicles shoppers
          </p>
        </div>
        <span className="admin-pill info">{threads.length} chats</span>
      </div>

      <section className="admin-panel" style={{ overflow: 'hidden' }}>
        <div className="dealer-msg-shell">
          <aside className="dealer-msg-list">
            {threads.length === 0 && (
              <div className="admin-empty">No customer messages yet.</div>
            )}
            {threads.map((thread) => (
              <button
                key={thread.id}
                type="button"
                className={`dealer-msg-item ${active?.id === thread.id ? 'is-active' : ''}`}
                onClick={() => setActiveId(thread.id)}
              >
                <strong>{thread.customerName}</strong>
                <span>{thread.carLabel ?? 'General chat'}</span>
                <em>{thread.messages[thread.messages.length - 1]?.text}</em>
              </button>
            ))}
          </aside>

          <div className="dealer-msg-chat">
            {!active ? (
              <div className="admin-empty">Select a conversation</div>
            ) : (
              <>
                <div className="dealer-msg-head">
                  <div>
                    <strong>{active.customerName}</strong>
                    <div style={{ color: '#64748b', fontSize: '0.8rem' }}>
                      {active.customerPhone} · {active.customerEmail}
                    </div>
                    <div style={{ color: '#64748b', fontSize: '0.8rem' }}>
                      {active.carLabel ?? 'General chat'}
                    </div>
                  </div>
                  {active.carId && (
                    <Link to={`/cars/${active.carId}`} target="_blank" className="admin-btn admin-btn-ghost">
                      View car
                    </Link>
                  )}
                </div>
                <div className="dealer-msg-stream">
                  {active.messages.map((m) => (
                    <div
                      key={m.id}
                      className={`dealer-msg-bubble ${m.sender === 'dealer' ? 'is-me' : 'is-them'}`}
                    >
                      <p>{m.text}</p>
                      <time>{new Date(m.createdAt).toLocaleString()}</time>
                    </div>
                  ))}
                </div>
                <form className="dealer-msg-composer" onSubmit={sendReply}>
                  <input
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder="Reply to customer…"
                    required
                  />
                  <button type="submit" className="admin-btn admin-btn-primary">
                    Send
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </section>
    </>
  )
}
