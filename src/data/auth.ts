import { adminAccounts, type AccountRole, type AdminAccount } from './admin'
import { dealers } from './dealers'
import { loanPartners } from './loans'

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

/** Demo password for all seeded accounts */
export const DEMO_PASSWORD = 'kenya123'

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

export function loginWithEmail(email: string, password: string) {
  const account = adminAccounts.find((a) => a.email.toLowerCase() === email.trim().toLowerCase())
  if (!account) return { ok: false as const, error: 'No account found for that email.' }
  if (password !== DEMO_PASSWORD) {
    return { ok: false as const, error: `Wrong password. Demo password is “${DEMO_PASSWORD}”.` }
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

export function loginAsDealer(dealerId: string) {
  const dealer = dealers.find((d) => d.id === dealerId)
  if (!dealer) return { ok: false as const, error: 'Dealer not found.' }

  const account =
    adminAccounts.find(
      (a) => a.role === 'Dealer' && a.email.toLowerCase() === dealer.email.toLowerCase(),
    ) ?? null

  const session: AuthSession = {
    accountId: account?.id ?? `dealer-${dealer.id}`,
    name: dealer.name,
    email: dealer.email,
    role: 'Dealer',
    city: dealer.city,
    plan: account?.plan ?? 'Growth',
    dealerId: dealer.id,
  }
  setSession(session)
  return { ok: true as const, session }
}

export function getDealerAccounts() {
  return dealers.map((d) => {
    const account = adminAccounts.find(
      (a) => a.role === 'Dealer' && a.email.toLowerCase() === d.email.toLowerCase(),
    )
    return {
      dealerId: d.id,
      name: d.name,
      email: d.email,
      city: d.city,
      plan: account?.plan ?? 'Starter',
      verified: d.verified,
    }
  })
}

export function getLoanPartnerAccounts() {
  return loanPartners
    .map((partner) => {
      const account = adminAccounts.find(
        (a) =>
          a.role === 'Loan partner' && a.name.toLowerCase() === partner.name.toLowerCase(),
      )
      if (!account || account.status === 'Suspended') return null
      return {
        loanPartnerId: partner.id,
        accountId: account.id,
        name: partner.name,
        email: account.email,
        city: account.city,
        type: partner.type,
        status: account.status,
      }
    })
    .filter((row): row is NonNullable<typeof row> => Boolean(row))
}

export function loginAsLoanPartner(loanPartnerId: string) {
  const partner = loanPartners.find((p) => p.id === loanPartnerId)
  if (!partner) return { ok: false as const, error: 'Loan partner not found.' }

  const account =
    adminAccounts.find(
      (a) =>
        a.role === 'Loan partner' && a.name.toLowerCase() === partner.name.toLowerCase(),
    ) ?? null

  if (account?.status === 'Suspended') {
    return { ok: false as const, error: 'This loan partner account is suspended.' }
  }

  const session: AuthSession = {
    accountId: account?.id ?? `lender-${partner.id}`,
    name: partner.name,
    email: account?.email ?? `${partner.id}@kenya-vehicles.demo`,
    role: 'Loan partner',
    city: account?.city ?? partner.cities[0] ?? 'Nairobi',
    loanPartnerId: partner.id,
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
