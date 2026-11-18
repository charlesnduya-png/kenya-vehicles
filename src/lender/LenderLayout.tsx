import { useEffect, useMemo, useState } from 'react'
import { NavLink, Navigate, Outlet, useLocation } from 'react-router-dom'
import { getSession, logout, subscribeAuth, type AuthSession } from '../data/auth'
import { subscribeEnquiries } from '../data/enquiries'
import { getLoanPartner, subscribeLoanPartners } from '../data/loans'
import {
  formatBadgeCount,
  getLenderBadges,
  getLenderNotificationTotal,
} from '../data/notifications'
import '../admin/admin.css'

const groups = [
  {
    label: 'Lending',
    items: [
      { to: '/lender', label: 'Overview', end: true, icon: 'grid' },
      { to: '/lender/applications', label: 'Applications', icon: 'inbox' },
      { to: '/lender/analytics', label: 'Analysis', icon: 'chart' },
    ],
  },
  {
    label: 'Account',
    items: [{ to: '/lender/profile', label: 'Partner profile', icon: 'bank' }],
  },
]

const titles: Record<string, { eyebrow: string; title: string }> = {
  '/lender': { eyebrow: 'Loan agent portal', title: 'Partner overview' },
  '/lender/applications': { eyebrow: 'Pipeline', title: 'Loan applications' },
  '/lender/analytics': { eyebrow: 'Insights', title: 'Loan analysis' },
  '/lender/profile': { eyebrow: 'Account', title: 'Partner profile' },
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
    case 'inbox':
      return (
        <svg {...common}>
          <path d="M4 13h4l2 3h4l2-3h4v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5z" />
          <path d="M4 13l2.5-7h11L20 13" />
        </svg>
      )
    case 'chart':
      return (
        <svg {...common}>
          <path d="M4 19V5" />
          <path d="M4 19h16" />
          <path d="M8 17V10" />
          <path d="M13 17V7" />
          <path d="M18 17v-4" />
        </svg>
      )
    default:
      return (
        <svg {...common}>
          <path d="M3 10l9-6 9 6" />
          <path d="M5 10v8M9 10v8M15 10v8M19 10v8" />
          <path d="M3 18h18" />
        </svg>
      )
  }
}

export function LenderLayout() {
  const { pathname } = useLocation()
  const [session, setSession] = useState<AuthSession | null>(() => getSession())
  const [partnerTick, setPartnerTick] = useState(0)
  const [notifyTick, setNotifyTick] = useState(0)
  const meta = titles[pathname] ?? { eyebrow: 'Loan agent portal', title: 'Kenya Vehicles' }

  useEffect(() => subscribeAuth(() => setSession(getSession())), [])
  useEffect(() => subscribeLoanPartners(() => setPartnerTick((n) => n + 1)), [])
  useEffect(() => subscribeEnquiries(() => setNotifyTick((n) => n + 1)), [])

  const badges = useMemo(() => {
    void notifyTick
    return session?.loanPartnerId ? getLenderBadges(session.loanPartnerId) : {}
  }, [session?.loanPartnerId, notifyTick])

  const totalNotify = useMemo(() => {
    void notifyTick
    return session?.loanPartnerId ? getLenderNotificationTotal(session.loanPartnerId) : 0
  }, [session?.loanPartnerId, notifyTick])

  if (!session) return <Navigate to="/login?next=/lender" replace />
  if (session.role !== 'Loan partner') return <Navigate to="/" replace />

  void partnerTick
  const partner = session.loanPartnerId ? getLoanPartner(session.loanPartnerId) : undefined
  const initial = session.name.slice(0, 1).toUpperCase()

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          {partner?.logo ? (
            <img
              src={partner.logo}
              alt=""
              className="admin-brand-mark"
              style={{ objectFit: 'cover', padding: 0 }}
            />
          ) : (
            <span
              className="admin-brand-mark"
              style={{ background: partner?.logoColor ?? '#0f766e', color: '#fff' }}
            >
              LA
            </span>
          )}
          <div>
            <strong>Loan Agent</strong>
            <small>{partner?.type ?? 'Partner'}</small>
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
            Live on Kenya Vehicles
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
            <NavLink
              to="/lender/applications"
              className="admin-icon-btn"
              aria-label={
                totalNotify > 0 ? `${totalNotify} new applications` : 'Notifications'
              }
              title="New loan applications"
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
              {partner?.logo ? (
                <img
                  src={partner.logo}
                  alt=""
                  className="admin-avatar"
                  style={{ objectFit: 'cover', display: 'block' }}
                />
              ) : (
                <span
                  className="admin-avatar"
                  style={{ background: partner?.logoColor ?? '#0f766e', color: '#fff' }}
                >
                  {initial}
                </span>
              )}
              <div>
                <strong>{session.name}</strong>
                <small>
                  Loan agent · {session.city}
                  {partner ? ` · ★ ${partner.rating}` : ''}
                </small>
              </div>
            </div>
          </div>
        </header>

        <div className="admin-content">
          <Outlet context={{ session, partner }} />
        </div>
      </div>
    </div>
  )
}
