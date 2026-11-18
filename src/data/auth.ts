import { adminAccounts, type AccountRole, type AdminAccount } from './admin'
import { dealers } from './dealers'
import { loanPartners } from './loans'
import {
  findAccountByEmail,
  getAccountPassword,
  hydrateRegisteredPartners,
  setAccountPassword,
} from './partnerRegistry'

export type AuthSession = {
  accountId: string
  name: string
  email: string
  role: AccountRole
  city: string
  dealerId?: string
  loanPartnerId?: string
  plan?: string
}

const STORAGE_KEY = 'kv-auth-session'
const EVENT = 'kv-auth-changed'

/** Platform admin login */
export const ADMIN_EMAIL = 'charlesnduya84@gmail.com'
export const ADMIN_PASSWORD = 'Babyblaq555@'

function dealerIdForAccount(account: AdminAccount) {
  return dealers.find((d) => d.email.toLowerCase() === account.email.toLowerCase())?.id
}

function loanPartnerIdForAccount(account: AdminAccount) {
  return loanPartners.find((p) => p.name.toLowerCase() === account.name.toLowerCase())?.id
}

export function getSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as AuthSession
  } catch {
    return null
  }
}

export function setSession(session: AuthSession | null) {
  if (session) localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
  else localStorage.removeItem(STORAGE_KEY)
  window.dispatchEvent(new Event(EVENT))
}

export function logout() {
  setSession(null)
}

function passwordForAccount(account: AdminAccount) {
  const stored = getAccountPassword(account.email)
  if (stored) return stored
  if (account.role === 'Admin') return ADMIN_PASSWORD
  return null
}

/** Reset password after email code verification (dealers, lenders, admin). */
export function resetAccountPassword(email: string, newPassword: string) {
  hydrateRegisteredPartners()
  const account = findAccountByEmail(email)
  if (!account) {
    return { ok: false as const, error: 'No account found for that email.' }
  }
  if (account.status === 'Suspended') {
    return { ok: false as const, error: 'This account is suspended.' }
  }
  if (newPassword.trim().length < 8) {
    return { ok: false as const, error: 'Password must be at least 8 characters.' }
  }
  setAccountPassword(account.email, newPassword)
  return { ok: true as const, account }
}

export function loginWithEmail(email: string, password: string) {
  hydrateRegisteredPartners()
  const account = adminAccounts.find((a) => a.email.toLowerCase() === email.trim().toLowerCase())
  if (!account) return { ok: false as const, error: 'No account found for that email.' }
  const expected = passwordForAccount(account)
  if (!expected || password !== expected) {
    return {
      ok: false as const,
      error: account.role === 'Admin' ? 'Wrong admin password.' : 'Wrong password.',
    }
  }
  if (account.status === 'Suspended') {
    return { ok: false as const, error: 'This account is suspended.' }
  }

  const session: AuthSession = {
    accountId: account.id,
    name: account.name,
    email: account.email,
    role: account.role,
    city: account.city,
    plan: account.plan,
    dealerId: account.role === 'Dealer' ? dealerIdForAccount(account) : undefined,
    loanPartnerId:
      account.role === 'Loan partner' ? loanPartnerIdForAccount(account) : undefined,
  }
  setSession(session)
  return { ok: true as const, session }
}

export function subscribeAuth(listener: () => void) {
  window.addEventListener(EVENT, listener)
  window.addEventListener('storage', listener)
  return () => {
    window.removeEventListener(EVENT, listener)
    window.removeEventListener('storage', listener)
  }
}

export function homePathForSession(session: AuthSession) {
  if (session.role === 'Admin') return '/admin'
  if (session.role === 'Dealer') return '/dealer'
  if (session.role === 'Loan partner') return '/lender'
  return '/'
}
