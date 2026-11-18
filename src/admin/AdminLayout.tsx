import { useEffect, useMemo, useState } from 'react'
import { NavLink, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { getSession, logout, subscribeAuth, type AuthSession } from '../data/auth'
import {
  formatBadgeCount,
  getAdminBadges,
  getAdminNotificationTotal,
} from '../data/notifications'
import { subscribeReports } from '../data/reports'
import './admin.css'

const groups = [
  {
    label: 'Command',
    items: [
      { to: '/admin', label: 'Overview', end: true, icon: 'grid' },
      { to: '/admin/analytics', label: 'Analytics', icon: 'chart' },
      { to: '/admin/announcements', label: 'Announcements', icon: 'megaphone' },
    ],
  },
  {
    label: 'Marketplace',
    items: [
      { to: '/admin/cars', label: 'Car sales', icon: 'car' },
      { to: '/admin/rentals', label: 'Car rentals', icon: 'key' },
      { to: '/admin/enquiries', label: 'Enquiries', icon: 'inbox' },
      { to: '/admin/reports', label: 'Reports', icon: 'flag' },
    ],
  },
  {
    label: 'Partners',
    items: [
      { to: '/admin/dealers', label: 'Dealers', icon: 'building' },
      { to: '/admin/loans', label: 'Loan partners', icon: 'bank' },
      { to: '/admin/accounts', label: 'Accounts', icon: 'users' },
    ],
  },
  {
    label: 'Revenue',
    items: [{ to: '/admin/billing', label: 'Subscriptions', icon: 'bank' }],
  },
]

const titles: Record<string, { eyebrow: string; title: string }> = {
  '/admin': { eyebrow: 'Command center', title: 'Platform overview' },
  '/admin/analytics': { eyebrow: 'Intelligence', title: 'Applications & leaders' },
  '/admin/announcements': { eyebrow: 'Command', title: 'Site announcements' },
  '/admin/cars': { eyebrow: 'Inventory', title: 'Car sales' },
  '/admin/rentals': { eyebrow: 'Fleet', title: 'Car rentals' },
  '/admin/dealers': { eyebrow: 'Network', title: 'Dealer partners' },
  '/admin/loans': { eyebrow: 'Finance', title: 'Loan partners' },
  '/admin/accounts': { eyebrow: 'Identity', title: 'All accounts' },
  '/admin/enquiries': { eyebrow: 'Pipeline', title: 'Enquiries & requests' },
  '/admin/reports': { eyebrow: 'Trust & safety', title: 'Account reports' },
  '/admin/billing': { eyebrow: 'Revenue', title: 'Subscriptions & badges' },
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
    case 'chart':
      return (
        <svg {...common}>
          <path d="M4 19V5" />
          <path d="M4 19h16" />
          <path d="M8 16v-5" />
          <path d="M12 16V8" />
          <path d="M16 16v-8" />
          <path d="M20 16v-3" />
        </svg>
      )
    case 'megaphone':
      return (
        <svg {...common}>
          <path d="M3 11v2a2 2 0 002 2h1l6 4V5L6 9H5a2 2 0 00-2 2z" />
          <path d="M16 9.5a3.5 3.5 0 010 5" />
          <path d="M18.5 8a6 6 0 010 8" />
        </svg>
      )
    case 'flag':
      return (
        <svg {...common}>
          <path d="M5 21V4" />
          <path d="M5 4h11l-2 3.5L16 11H5" />
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
    case 'key':
      return (
        <svg {...common}>
          <circle cx="8" cy="14" r="3" />
          <path d="M10.5 12.5L19 4l2 2-2 2" />
          <path d="M15 8l2 2" />
        </svg>
      )
    case 'inbox':
      return (
        <svg {...common}>
          <path d="M4 13h4l2 3h4l2-3h4v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5z" />
          <path d="M4 13l2.5-7h11L20 13" />
        </svg>
      )
    case 'building':
      return (
        <svg {...common}>
          <path d="M4 20V6a2 2 0 012-2h7v16" />
          <path d="M13 10h5a2 2 0 012 2v8" />
          <path d="M8 8h1M8 12h1M8 16h1M16 14h1M16 17h1" />
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
          <circle cx="9" cy="8" r="3" />
          <circle cx="16" cy="9" r="2.5" />
          <path d="M3 19c1.5-3 4-4.5 6-4.5S13.5 16 15 19" />
          <path d="M14 14.5c1.4 0 3.2.8 4.5 2.5" />
        </svg>
      )
  }
}

export function AdminLayout() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const [session, setSession] = useState<AuthSession | null>(() => getSession())
  const [notifyTick, setNotifyTick] = useState(0)
  const meta = titles[pathname] ?? { eyebrow: 'Admin', title: 'Kenya Vehicles' }

  useEffect(() => subscribeAuth(() => setSession(getSession())), [])
  useEffect(() => subscribeReports(() => setNotifyTick((n) => n + 1)), [])

  const badges = useMemo(() => {
    void notifyTick
    return getAdminBadges()
  }, [notifyTick, pathname])

  const totalNotify = useMemo(() => {
    void notifyTick
    return getAdminNotificationTotal()
  }, [notifyTick, pathname])

  function signOut() {
    logout()
    navigate('/login?next=/admin', { replace: true })
  }

  if (!session) return <Navigate to="/login?next=/admin" replace />
  if (session.role !== 'Admin') return <Navigate to="/login?next=/admin" replace />

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <span className="admin-brand-mark">KV</span>
          <div>
            <strong>Kenya Vehicles</strong>
            <small>Enterprise Admin</small>
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
            Systems operational
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
            onClick={signOut}
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
              <input placeholder="Search inventory, accounts, tickets…" />
            </div>
            <NavLink
              to="/admin/enquiries"
              className="admin-icon-btn"
              aria-label={
                totalNotify > 0 ? `${totalNotify} notifications` : 'Notifications'
              }
              title="Enquiries, reports & pending accounts"
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
              <span className="admin-avatar">A</span>
              <div>
                <strong>{session.name}</strong>
                <small>Superuser · Nairobi</small>
              </div>
            </div>
          </div>
        </header>

        <div className="admin-content">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
