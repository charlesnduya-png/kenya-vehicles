import { useMemo, useState } from 'react'
import { formatKES } from '../data/cars'
import { loanPartners } from '../data/loans'

export function AdminLoans() {
  const [q, setQ] = useState('')

  const filtered = useMemo(() => {
    return loanPartners.filter((p) => {
      const hay = `${p.name} ${p.type} ${p.cities.join(' ')}`.toLowerCase()
      return !q || hay.includes(q.toLowerCase())
    })
  }, [q])

  return (
    <>
      <div className="admin-toolbar">
        <div>
          <h2>Loan partners</h2>
          <p style={{ margin: '0.2rem 0 0', color: '#64748b', fontSize: '0.85rem' }}>
            Banks, saccos, microfinance, and fintech lenders on the platform
          </p>
        </div>
        <div className="admin-toolbar-actions">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search lenders…" />
          <button type="button" className="admin-btn admin-btn-primary">
            Add partner
          </button>
        </div>
      </div>

      <section className="admin-panel">
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Partner</th>
                <th>Type</th>
                <th>Rating</th>
                <th>Rates</th>
                <th>Deposit</th>
                <th>Max term</th>
                <th>Max loan</th>
                <th>Coverage</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                      {p.logo ? (
                        <img
                          src={p.logo}
                          alt=""
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 6,
                            objectFit: 'cover',
                            border: '1px solid #e5e7eb',
                          }}
                        />
                      ) : (
                        <span
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 6,
                            background: p.logoColor,
                            display: 'inline-block',
                          }}
                        />
                      )}
                      <div>
                        <strong>{p.name}</strong>
                        <div style={{ color: '#64748b', fontSize: '0.8rem' }}>{p.highlight}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="admin-pill info">{p.type}</span>
                  </td>
                  <td className="mono">
                    ★ {p.rating} · {p.reviewCount}
                  </td>
                  <td className="mono">
                    {p.rateFrom}% – {p.rateTo}%
                  </td>
                  <td className="mono">From {p.minDepositPercent}%</td>
                  <td className="mono">{p.maxTermMonths} mo</td>
                  <td className="mono">{formatKES(p.maxLoan)}</td>
                  <td>{p.cities.join(', ')}</td>
                  <td>
                    <div className="admin-row-actions">
                      <button type="button">Edit</button>
                      <button type="button">Pause</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  )
}
