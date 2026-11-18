import { useEffect, useMemo, useState } from 'react'
import {
  getReports,
  subscribeReports,
  updateReportStatus,
  type AccountReport,
  type ReportStatus,
} from '../data/reports'

export function AdminReports() {
  const [items, setItems] = useState<AccountReport[]>(() => getReports())
  const [q, setQ] = useState('')
  const [status, setStatus] = useState<'All' | ReportStatus>('All')
  const [toast, setToast] = useState('')

  useEffect(() => subscribeReports(() => setItems(getReports())), [])

  const filtered = useMemo(() => {
    return items.filter((r) => {
      const hay = `${r.targetName} ${r.reporterName} ${r.reason} ${r.details}`.toLowerCase()
      return (
        (!q || hay.includes(q.toLowerCase())) &&
        (status === 'All' || r.status === status)
      )
    })
  }, [items, q, status])

  function flash(message: string) {
    setToast(message)
    window.setTimeout(() => setToast(''), 2500)
  }

  function statusClass(s: ReportStatus) {
    if (s === 'New') return 'info'
    if (s === 'Under review') return 'warn'
    if (s === 'Resolved') return 'ok'
    return 'muted'
  }

  return (
    <>
      {toast && <div className="admin-toast">{toast}</div>}

      <div className="admin-toolbar">
        <div>
          <h2>Account reports</h2>
          <p style={{ margin: '0.2rem 0 0', color: '#64748b', fontSize: '0.85rem' }}>
            Customer reports against dealers, agents, and rental partners
          </p>
        </div>
        <div className="admin-toolbar-actions">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search reports…" />
          <select value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
            <option value="All">All status</option>
            <option>New</option>
            <option>Under review</option>
            <option>Resolved</option>
            <option>Dismissed</option>
          </select>
          <span className="admin-pill info">
            {items.filter((r) => r.status === 'New').length} new
          </span>
        </div>
      </div>

      <section className="admin-panel">
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Report</th>
                <th>Target</th>
                <th>Reporter</th>
                <th>Created</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filtered.map((report) => (
                <tr key={report.id}>
                  <td>
                    <strong>{report.reason}</strong>
                    <div style={{ color: '#64748b', fontSize: '0.8rem', marginTop: '0.2rem' }}>
                      {report.details}
                    </div>
                    {report.relatedListing && (
                      <div style={{ color: '#64748b', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                        Listing: {report.relatedListing}
                      </div>
                    )}
                  </td>
                  <td>
                    <strong>{report.targetName}</strong>
                    <div style={{ color: '#64748b', fontSize: '0.8rem' }}>
                      {report.targetType} · {report.targetId}
                    </div>
                  </td>
                  <td>
                    {report.reporterName}
                    <div style={{ color: '#64748b', fontSize: '0.8rem' }}>
                      {report.reporterPhone}
                    </div>
                    <div style={{ color: '#64748b', fontSize: '0.75rem' }}>
                      {report.reporterEmail}
                    </div>
                  </td>
                  <td className="mono">{new Date(report.createdAt).toLocaleString()}</td>
                  <td>
                    <span className={`admin-pill ${statusClass(report.status)}`}>
                      {report.status}
                    </span>
                  </td>
                  <td>
                    <div className="admin-row-actions">
                      {report.status === 'New' && (
                        <button
                          type="button"
                          onClick={() => {
                            updateReportStatus(report.id, 'Under review')
                            flash('Marked under review')
                          }}
                        >
                          Review
                        </button>
                      )}
                      {report.status !== 'Resolved' && report.status !== 'Dismissed' && (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              updateReportStatus(report.id, 'Resolved')
                              flash('Report resolved')
                            }}
                          >
                            Resolve
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              updateReportStatus(report.id, 'Dismissed')
                              flash('Report dismissed')
                            }}
                          >
                            Dismiss
                          </button>
                        </>
                      )}
                      {(report.status === 'Resolved' || report.status === 'Dismissed') && (
                        <button
                          type="button"
                          onClick={() => {
                            updateReportStatus(report.id, 'Under review')
                            flash('Reopened for review')
                          }}
                        >
                          Reopen
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6}>
                    <div className="admin-empty">No reports match those filters.</div>
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
