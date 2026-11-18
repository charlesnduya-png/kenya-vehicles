import { type FormEvent, useEffect, useMemo, useState } from 'react'
import {
  createAnnouncement,
  deleteAnnouncement,
  getAnnouncements,
  pushAnnouncement,
  subscribeAnnouncements,
  unpublishAnnouncement,
  type AnnouncementTone,
  type SiteAnnouncement,
} from '../data/announcements'

export function AdminAnnouncements() {
  const [items, setItems] = useState<SiteAnnouncement[]>(() => getAnnouncements())
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [tone, setTone] = useState<AnnouncementTone>('info')
  const [pushNow, setPushNow] = useState(true)
  const [toast, setToast] = useState('')

  useEffect(() => subscribeAnnouncements(() => setItems(getAnnouncements())), [])

  const live = useMemo(() => items.find((a) => a.active) ?? null, [items])

  function flash(text: string) {
    setToast(text)
    window.setTimeout(() => setToast(''), 2500)
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!title.trim() || !message.trim()) return
    createAnnouncement({ title, message, tone, pushNow })
    setTitle('')
    setMessage('')
    flash(pushNow ? 'Announcement pushed live to the site' : 'Announcement saved as draft')
  }

  return (
    <>
      {toast && <div className="admin-toast">{toast}</div>}

      <div className="admin-toolbar">
        <div>
          <h2>Site announcements</h2>
          <p style={{ margin: '0.2rem 0 0', color: '#64748b', fontSize: '0.85rem' }}>
            Push a banner message to the Kenya Vehicles marketplace
          </p>
        </div>
        {live ? (
          <span className="admin-pill ok">Live on site</span>
        ) : (
          <span className="admin-pill muted">No live announcement</span>
        )}
      </div>

      <div className="admin-grant-grid">
        <form className="admin-panel admin-grant-card" onSubmit={onSubmit}>
          <div className="admin-panel-head">
            <div>
              <h2>Compose announcement</h2>
              <p>Shown as a banner under the marketplace header</p>
            </div>
          </div>
          <div className="admin-grant-body">
            <div className="admin-grant-fields">
              <label>
                Title
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Easter weekend deals"
                  required
                />
              </label>
              <label>
                Message
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Write the announcement shoppers should see…"
                  rows={4}
                  required
                />
              </label>
              <label>
                Tone
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value as AnnouncementTone)}
                >
                  <option value="info">Info</option>
                  <option value="success">Success / promo</option>
                  <option value="warning">Warning / urgent</option>
                </select>
              </label>
              <label className="admin-check">
                <input
                  type="checkbox"
                  checked={pushNow}
                  onChange={(e) => setPushNow(e.target.checked)}
                />
                Push live immediately (replaces any current banner)
              </label>
            </div>
            <button type="submit" className="admin-btn admin-btn-primary">
              {pushNow ? 'Push to site' : 'Save draft'}
            </button>
          </div>
        </form>

        <section className="admin-panel admin-grant-card">
          <div className="admin-panel-head">
            <div>
              <h2>Currently live</h2>
              <p>What shoppers see right now</p>
            </div>
          </div>
          <div className="admin-grant-body">
            {live ? (
              <div className={`admin-announce-preview tone-${live.tone}`}>
                <strong>{live.title}</strong>
                <p>{live.message}</p>
                <small>
                  Pushed {live.pushedAt ? new Date(live.pushedAt).toLocaleString() : '—'} ·{' '}
                  {live.pushedBy}
                </small>
                <div className="admin-row-actions" style={{ marginTop: '0.85rem' }}>
                  <button type="button" onClick={() => {
                    unpublishAnnouncement(live.id)
                    flash('Announcement unpublished')
                  }}>
                    Unpublish
                  </button>
                </div>
              </div>
            ) : (
              <div className="admin-empty">No announcement is live on the site.</div>
            )}
          </div>
        </section>
      </div>

      <section className="admin-panel" style={{ marginTop: '1rem' }}>
        <div className="admin-panel-head">
          <div>
            <h2>Announcement history</h2>
            <p>{items.length} saved messages</p>
          </div>
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Announcement</th>
                <th>Tone</th>
                <th>Created</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>
                    <strong>{item.title}</strong>
                    <div style={{ color: '#64748b', fontSize: '0.8rem' }}>{item.message}</div>
                  </td>
                  <td>
                    <span className="admin-pill muted">{item.tone}</span>
                  </td>
                  <td className="mono">{new Date(item.createdAt).toLocaleDateString()}</td>
                  <td>
                    <span className={`admin-pill ${item.active ? 'ok' : 'muted'}`}>
                      {item.active ? 'Live' : 'Off'}
                    </span>
                  </td>
                  <td>
                    <div className="admin-row-actions">
                      {item.active ? (
                        <button
                          type="button"
                          onClick={() => {
                            unpublishAnnouncement(item.id)
                            flash('Announcement unpublished')
                          }}
                        >
                          Unpublish
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            pushAnnouncement(item.id)
                            flash('Announcement pushed live')
                          }}
                        >
                          Push live
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          deleteAnnouncement(item.id)
                          flash('Announcement deleted')
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={5}>
                    <div className="admin-empty">No announcements yet.</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  )
}
