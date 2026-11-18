import { useEffect, useState, type FormEvent } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import {
  getSession,
  homePathForSession,
  logout,
  subscribeAuth,
  type AuthSession,
} from '../data/auth'
import { getCustomerIdentity, subscribeMessages } from '../data/messages'
import { formatBadgeCount, getCustomerMessageBadges } from '../data/notifications'
import { BrandLogo } from './BrandLogo'
import './Navbar.css'

const links = [
  { to: '/cars', label: 'All Cars' },
  { to: '/rentals', label: 'Car Rental' },
  { to: '/cars?body=SUV', label: 'SUVs' },
  { to: '/cars?body=Pickup', label: 'Pickups' },
  { to: '/dealers', label: 'Dealers' },
  { to: '/loans', label: 'Car Loans' },
  { to: '/pricing', label: 'Pricing' },
  { to: '/join', label: 'Sell on Kenya Vehicles' },
]

export function Navbar() {
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [category, setCategory] = useState('All')
  const [open, setOpen] = useState(false)
  const [session, setSession] = useState<AuthSession | null>(() => getSession())
  const [messageBadge, setMessageBadge] = useState(() => getCustomerMessageBadges())

  useEffect(() => subscribeAuth(() => setSession(getSession())), [])
  useEffect(() => {
    const refresh = () => setMessageBadge(getCustomerMessageBadges(getCustomerIdentity()?.phone))
    refresh()
    return subscribeMessages(refresh)
  }, [])

  function onSearch(e: FormEvent) {
    e.preventDefault()
    const params = new URLSearchParams()
    if (q.trim()) params.set('q', q.trim())
    if (category !== 'All') params.set('body', category)
    navigate(`/cars?${params.toString()}`)
    setOpen(false)
  }

  const accountHref = session ? homePathForSession(session) : '/login'
  const accountHello = session
    ? session.role === 'Dealer'
      ? 'Hello, Dealer'
      : session.role === 'Loan partner'
        ? 'Hello, Loan agent'
        : `Hello, ${session.name.split(' ')[0]}`
    : 'Hello, sign in'
  const accountLabel = session
    ? session.role === 'Dealer'
      ? 'Dealer portal'
      : session.role === 'Loan partner'
        ? 'Loan agent portal'
        : session.role === 'Admin'
          ? 'Admin console'
          : 'Your account'
    : 'Account & Lists'

  return (
    <header className="amz-header">
      <div className="amz-top">
        <div className="container amz-top-inner">
          <button
            className="amz-menu-btn"
            aria-label="Menu"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            ☰
          </button>

          <BrandLogo onClick={() => setOpen(false)} />

          <div className="amz-deliver">
            <span className="amz-deliver-label">Deliver to</span>
            <strong>Kenya</strong>
          </div>

          <form className="amz-search" onSubmit={onSearch}>
            <select
              aria-label="Category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option>All</option>
              <option>SUV</option>
              <option>Sedan</option>
              <option>Hatchback</option>
              <option>Pickup</option>
              <option>Van</option>
            </select>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search cars, rentals, dealers, loans"
              aria-label="Search"
            />
            <button type="submit" aria-label="Search">
              🔍
            </button>
          </form>

          <Link to={accountHref} className="amz-account">
            <span>{accountHello}</span>
            <strong>{accountLabel}</strong>
          </Link>

          <Link to="/messages" className="amz-messages" aria-label="Messages">
            <span className="amz-messages-label">
              <span>Your</span>
              <strong>Messages</strong>
            </span>
            <span className="amz-messages-icon" aria-hidden="true">
              💬
            </span>
            {messageBadge > 0 && (
              <em className="amz-notify-badge" aria-label={`${messageBadge} unread`}>
                {formatBadgeCount(messageBadge)}
              </em>
            )}
          </Link>

          <Link to="/loans" className="amz-account">
            <span>Returns</span>
            <strong>&amp; Loans</strong>
          </Link>

          <Link to="/cars" className="amz-cart">
            <span className="amz-cart-icon">🛒</span>
            <strong>Cars</strong>
          </Link>
        </div>
      </div>

      <div className={`amz-sub ${open ? 'is-open' : ''}`}>
        <div className="container amz-sub-inner">
          <NavLink to="/cars" className="amz-all" onClick={() => setOpen(false)}>
            ☰ All
          </NavLink>
          {links.map((link) => (
            <NavLink key={link.to} to={link.to} onClick={() => setOpen(false)}>
              {link.label}
            </NavLink>
          ))}
          <NavLink to="/messages" onClick={() => setOpen(false)}>
            Messages
            {messageBadge > 0 ? ` (${formatBadgeCount(messageBadge)})` : ''}
          </NavLink>
          {session ? (
            <button
              type="button"
              className="amz-signout"
              onClick={() => {
                logout()
                setOpen(false)
                navigate('/login')
              }}
            >
              Sign out
            </button>
          ) : (
            <NavLink to="/login" onClick={() => setOpen(false)}>
              Sign in
            </NavLink>
          )}
        </div>
      </div>
    </header>
  )
}
