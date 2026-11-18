import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { VerifiedBadge } from '../components/VerifiedBadge'
import {
  adminAccounts as seedAccounts,
  type AccountRole,
  type AccountStatus,
  type AdminAccount,
} from '../data/admin'

export function AdminAccounts() {
  const [q, setQ] = useState('')
  const [role, setRole] = useState<'All' | AccountRole>('All')
  const [status, setStatus] = useState<'All' | AccountStatus>('All')
  const [accounts, setAccounts] = useState<AdminAccount[]>(seedAccounts)
  const [toast, setToast] = useState('')

  const filtered = useMemo(() => {
    return accounts.filter((a) => {
      const hay = `${a.name} ${a.email} ${a.phone} ${a.city}`.toLowerCase()
      const matchesQ = !q || hay.includes(q.toLowerCase())
      const matchesRole = role === 'All' || a.role === role
      const matchesStatus = status === 'All' || a.status === status
      return matchesQ && matchesRole && matchesStatus
    })
  }, [q, role, status, accounts])

  function flash(message: string) {
    setToast(message)
    window.setTimeout(() => setToast(''), 2500)
  }

  function grantAgentSub(id: string) {
    setAccounts((prev) =>
      prev.map((a) =>
        a.id === id
          ? {
              ...a,
              role: 'Agent',
              plan: 'Agent Pro',
              billingStatus: 'Active',
              status: 'Active',
            }
          : a,
      ),
    )
    flash('Agent subscription granted (Agent Pro)')
  }

  function grantBadge(id: string) {
    setAccounts((prev) =>
      prev.map((a) =>
        a.id === id
          ? {
              ...a,
              verifiedBadge: true,
              plan: a.plan?.includes('Badge') ? a.plan : `${a.plan ?? 'Agent'} + Verified Badge`,
              billingStatus: 'Active',
              status: 'Active',
            }
          : a,
      ),
    )
    flash('Verified badge granted')
  }

  function revokeBadge(id: string) {
    setAccounts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, verifiedBadge: false } : a)),
    )
    flash('Verified badge revoked')
  }

  function statusClass(s: AccountStatus) {
    if (s === 'Active') return 'ok'
    if (s === 'Pending') return 'warn'
    return 'danger'
  }

  return (
    <>
      {toast && <div className="admin-toast">{toast}</div>}

      <div className="admin-toolbar">
        <div>
          <h2>Accounts</h2>
          <p style={{ margin: '0.2rem 0 0', color: '#64748b', fontSize: '0.85rem' }}>
            Buyers, dealers (monthly plans), agents (subscriptions + verified badges), lenders, and
            admins ·{' '}
            <Link to="/admin/billing" style={{ fontWeight: 700 }}>
              Open billing grants
            </Link>
          </p>
        </div>
        <div className="admin-toolbar-actions">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search accounts…" />
          <select value={role} onChange={(e) => setRole(e.target.value as typeof role)}>
            <option value="All">All roles</option>
            <option>Buyer</option>
            <option>Dealer</option>
            <option>Agent</option>
            <option>Rental partner</option>
            <option>Loan partner</option>
            <option>Admin</option>
          </select>
          <select value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
            <option value="All">All status</option>
            <option>Active</option>
            <option>Pending</option>
            <option>Suspended</option>
          </select>
        </div>
      </div>

      <div className="admin-grid-kpi" style={{ marginBottom: '0.85rem' }}>
        <article className="admin-kpi">
          <span>Total accounts</span>
          <strong>{accounts.length}</strong>
        </article>
        <article className="admin-kpi">
          <span>Buyers</span>
          <strong>{accounts.filter((a) => a.role === 'Buyer').length}</strong>
        </article>
        <article className="admin-kpi">
          <span>Dealers + agents</span>
          <strong>
            {accounts.filter((a) => a.role === 'Dealer' || a.role === 'Agent').length}
          </strong>
        </article>
        <article className="admin-kpi">
          <span>Needs review</span>
          <strong>{accounts.filter((a) => a.status !== 'Active').length}</strong>
        </article>
      </div>

      <section className="admin-panel">
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Account</th>
                <th>Role</th>
                <th>Plan / badge</th>
                <th>Billing</th>
                <th>City</th>
                <th>Last active</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filtered.map((account) => (
                <tr key={account.id}>
                  <td>
                    <strong className="with-verified">
                      <span>{account.name}</span>
                      {account.verifiedBadge && (
                        <VerifiedBadge title="Verified agent" size={15} />
                      )}
                    </strong>
                    <div style={{ color: '#64748b', fontSize: '0.8rem' }}>{account.email}</div>
                  </td>
                  <td>
                    <span className="admin-pill muted">{account.role}</span>
                  </td>
                  <td>{account.plan ?? '—'}</td>
                  <td>
                    {account.billingStatus ? (
                      <span
                        className={`admin-pill ${
                          account.billingStatus === 'Active'
                            ? 'ok'
                            : account.billingStatus === 'Past due' || account.billingStatus === 'Trial'
                              ? 'warn'
                              : 'muted'
                        }`}
                      >
                        {account.billingStatus}
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td>{account.city}</td>
                  <td>{account.lastActive}</td>
                  <td>
                    <span className={`admin-pill ${statusClass(account.status)}`}>
                      {account.status}
                    </span>
                  </td>
                  <td>
                    <div className="admin-row-actions">
                      {account.role === 'Agent' && (
                        <>
                          <button type="button" onClick={() => grantAgentSub(account.id)}>
                            Grant sub
                          </button>
                          {account.verifiedBadge ? (
                            <button type="button" onClick={() => revokeBadge(account.id)}>
                              Revoke badge
                            </button>
                          ) : (
                            <button type="button" onClick={() => grantBadge(account.id)}>
                              Grant badge
                            </button>
                          )}
                        </>
                      )}
                      {account.role !== 'Agent' && (
                        <button type="button">
                          {account.status === 'Active' ? 'Suspend' : 'Activate'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8}>
                    <div className="admin-empty">No accounts match those filters.</div>
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
