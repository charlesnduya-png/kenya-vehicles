import { useEffect, useState } from 'react'
import {
  getActiveAnnouncement,
  subscribeAnnouncements,
  type SiteAnnouncement,
} from '../data/announcements'
import './SiteAnnouncement.css'

const DISMISS_KEY = 'kv-announcement-dismissed'

export function SiteAnnouncement() {
  const [live, setLive] = useState<SiteAnnouncement | null>(() => getActiveAnnouncement())
  const [dismissedId, setDismissedId] = useState(() => sessionStorage.getItem(DISMISS_KEY))

  useEffect(() => {
    return subscribeAnnouncements(() => {
      const next = getActiveAnnouncement()
      setLive(next)
      if (!next || next.id !== sessionStorage.getItem(DISMISS_KEY)) {
        setDismissedId(sessionStorage.getItem(DISMISS_KEY))
      }
    })
  }, [])

  if (!live || dismissedId === live.id) return null

  function dismiss() {
    sessionStorage.setItem(DISMISS_KEY, live!.id)
    setDismissedId(live!.id)
  }

  return (
    <div className={`site-announce tone-${live.tone}`} role="status">
      <div className="container site-announce-inner">
        <div className="site-announce-copy">
          <strong>{live.title}</strong>
          <span>{live.message}</span>
        </div>
        <button type="button" className="site-announce-close" onClick={dismiss} aria-label="Dismiss">
          ×
        </button>
      </div>
    </div>
  )
}
