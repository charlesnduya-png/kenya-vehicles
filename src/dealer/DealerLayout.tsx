import { useEffect, useMemo, useState } from 'react'
import { NavLink, Navigate, Outlet, useLocation } from 'react-router-dom'
import { getSession, logout, subscribeAuth, type AuthSession } from '../data/auth'
import { getDealer, subscribeDealerLogos } from '../data/dealers'
import { subscribeEnquiries } from '../data/enquiries'
import { subscribeMessages } from '../data/messages'
import {
  formatBadgeCount,
  getDealerBadges,
  getDealerNotificationTotal,
} from '../data/notifications'
import { subscribeOffers } from '../data/offers'
import '../admin/admin.css'

const groups = [
  {
    label: 'Yard',
    items: [
      { to: '/dealer', label: 'Overview', end: true, icon: 'grid' },
      { to: '/dealer/inventory', label: 'Inventory', icon: 'car' },
      { to: '/dealer/enquiries', label: 'Enquiries', icon: 'inbox' },
      { to: '/dealer/offers', label: 'Offers', icon: 'tag' },
      { to: '/dealer/messages', label: 'Messages', icon: 'chat' },
    ],
  },
  {
    label: 'Account',
    items: [
      { to: '/dealer/subscription', label: 'Subscription', icon: 'bank' },
      { to: '/dealer/profile', label: 'Yard profile', icon: 'building' },
    ],
  },
]

const titles: Record<string, { eyebrow: string; title: string }> = {
  '/dealer': { eyebrow: 'Dealer portal', title: 'Yard overview' },
  '/dealer/inventory': { eyebrow: 'Stock', title: 'Your inventory' },
  '/dealer/enquiries': { eyebrow: 'Pipeline', title: 'Buyer enquiries' },
  '/dealer/offers': { eyebrow: 'Pipeline', title: 'Customer offers' },
  '/dealer/messages': { eyebrow: 'Inbox', title: 'Customer messages' },
  '/dealer/subscription': { eyebrow: 'Billing', title: 'Subscription plan' },
  '/dealer/profile': { eyebrow: 'Account', title: 'Yard profile' },
}

function NavIcon({ name }: { name: string }) {
  const common = {
    width: 16,
    height: 16,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  }

  switch (name) {
    case 'grid':
      return (
        <svg {...common}>
          <rect x="3" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="3" width="7" height="7" rx="1.5" />
          <rect x="3" y="14" width="7" height="7" rx="1.5" />
          <rect x="14" y="14" width="7" height="7" rx="1.5" />
        </svg>
      )
    case 'car':
      return (
        <svg {...common}>
          <path d="M5 16l1.5-6h11L19 16" />
          <path d="M7 10l1.2-3h7.6L17 10" />
          <circle cx="7.5" cy="16.5" r="1.5" />
          <circle cx="16.5" cy="16.5" r="1.5" />
        </svg>
      )
    case 'inbox':
      return (
        <svg {...common}>
          <path d="M4 13h4l2 3h4l2-3h4v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5z" />
          <path d="M4 13l2.5-7h11L20 13" />
        </svg>
      )
    case 'tag':
      return (
        <svg {...common}>
          <path d="M20 12l-8 8-9-9V3h8l9 9z" />
          <circle cx="7.5" cy="7.5" r="1.2" />
        </svg>
      )
    case 'chat':
      return (
        <svg {...common}>
          <path d="M21 12a8 8 0 01-8 8H7l-4 3V12a8 8 0 018-8h2a8 8 0 018 8z" />
        </svg>
      )
    case 'bank':
      return (
        <svg {...common}>
          <path d="M3 10l9-6 9 6" />
          <path d="M5 10v8M9 10v8M15 10v8M19 10v8" />
          <path d="M3 18h18" />
        </svg>
      )
    default:
      return (
        <svg {...common}>
          <path d="M4 20V6a2 2 0 012-2h7v16" />
          <path d="M13 10h5a2 2 0 012 2v8" />
          <path d="M8 8h1M8 12h1M8 16h1M16 14h1M16 17h1" />
        </svg>
      )
  }
}

export function DealerLayout() {
  const { pathname } = useLocation()
  const [session, setSession] = useState<AuthSession | null>(() => getSession())
  const [logoTick, setLogoTick] = useState(0)
  const [notifyTick, setNotifyTick] = useState(0)
  const meta = titles[pathname] ?? { eyebrow: 'Dealer portal', title: 'Kenya Vehicles' }

  useEffect(() => subscribeAuth(() => setSession(getSession())), [])
  useEffect(() => subscribeDealerLogos(() => setLogoTick((n) => n + 1)), [])
  useEffect(() => {
    const refresh = () => setNotifyTick((n) => n + 1)
    const offs = [subscribeEnquiries(refresh), subscribeOffers(refresh), subscribeMessages(refresh)]
    return () => offs.forEach((off) => off())
  }, [])

  const badges = useMemo(() => {
    void notifyTick
    return session?.dealerId ? getDealerBadges(session.dealerId) : {}
  }, [session?.dealerId, notifyTick])

  const totalNotify = useMemo(() => {
    void notifyTick
    return session?.dealerId ? getDealerNotificationTotal(session.dealerId) : 0
  }, [session?.dealerId, notifyTick])

  if (!session) return <Navigate to="/login?next=/dealer" replace />
  if (session.role !== 'Dealer') return <Navigate to="/" replace />

  const dealer = session.dealerId ? getDealer(session.dealerId) : undefined
  void logoTick
  const initial = session.name.slice(0, 1).toUpperCase()

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          {dealer?.logo ? (
            <img
              src={dealer.logo}
              alt=""
              className="admin-brand-mark"
              style={{ objectFit: 'cover', padding: 0 }}
            />
          ) : (
            <span className="admin-brand-mark">YD</span>
          )}
          <div>
            <strong>Dealer Portal</strong>
            <small>{session.plan ?? 'Yard'} plan</small>
          </div>
        </div>

        <div className="admin-side-scroll">
          {groups.map((group) => (
            <div key={group.label} className="admin-nav-group">
              <p className="admin-nav-label">{group.label}</p>
              <nav className="admin-nav">
                {group.items.map((item) => {
                  const count = badges[item.to] ?? 0
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={'end' in item ? item.end : false}
                      className={({ isActive }) => (isActive ? 'is-active' : undefined)}
                    >
                      <NavIcon name={item.icon} />
                      <span>{item.label}</span>
                      {count > 0 && (
                        <em className="admin-nav-badge" aria-label={`${count} new`}>
                          {formatBadgeCount(count)}
                        </em>
                      )}
                    </NavLink>
                  )
                })}
              </nav>
            </div>
          ))}
        </div>

        <div className="admin-sidebar-foot">
          <div className="admin-system-status">
            <span className="admin-pulse" />
            {dealer?.verified ? 'Verified yard' : 'Pending verification'}
          </div>
          <NavLink to="/" className="admin-exit">
            Exit to marketplace
          </NavLink>
          <button
            type="button"
            className="admin-exit"
            style={{
              width: '100%',
              marginTop: '0.45rem',
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.12)',
              cursor: 'pointer',
            }}
            onClick={() => logout()}
          >
            Sign out
          </button>
        </div>
      </aside>

      <div className="admin-main">
        <header className="admin-topbar">
          <div>
            <p className="admin-eyebrow">{meta.eyebrow}</p>
            <h1>{meta.title}</h1>
          </div>
          <div className="admin-topbar-right">
            <div className="admin-search">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="7" />
                <path d="M20 20l-3-3" />
              </svg>
              <input placeholder="Search your listings & enquiries…" />
            </div>
            <NavLink
              to="/dealer/messages"
              className="admin-icon-btn"
              aria-label={
                totalNotify > 0 ? `${totalNotify} notifications` : 'Notifications'
              }
              title="Messages, enquiries & offers"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M6 9a6 6 0 0112 0c0 7 3 7 3 7H3s3 0 3-7" />
                <path d="M10 19a2 2 0 004 0" />
              </svg>
              {totalNotify > 0 && (
                <span className="admin-notify-count">{formatBadgeCount(totalNotify)}</span>
              )}
            </NavLink>
            <div className="admin-user">
              {dealer?.logo ? (
                <img
                  src={dealer.logo}
                  alt=""
                  className="admin-avatar"
                  style={{ objectFit: 'cover', display: 'block' }}
                />
              ) : (
                <span className="admin-avatar">{initial}</span>
              )}
              <div>
                <strong>{session.name}</strong>
                <small>
                  Dealer · {session.city}
                  {dealer?.verified ? ' · Verified' : ''}
                </small>
              </div>
            </div>
          </div>
        </header>

        <div className="admin-content">
          <Outlet context={{ session, dealer }} />
        </div>
      </div>
    </div>
  )
}
