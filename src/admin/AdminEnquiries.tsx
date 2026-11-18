import { useMemo, useState } from 'react'
import { adminEnquiries, type EnquiryStatus, type EnquiryType } from '../data/admin'

export function AdminEnquiries() {
  const [q, setQ] = useState('')
  const [type, setType] = useState<'All' | EnquiryType>('All')
  const [status, setStatus] = useState<'All' | EnquiryStatus>('All')

  const filtered = useMemo(() => {
    return adminEnquiries.filter((e) => {
      const hay = `${e.customer} ${e.subject} ${e.related} ${e.phone}`.toLowerCase()
      return (
        (!q || hay.includes(q.toLowerCase())) &&
        (type === 'All' || e.type === type) &&
        (status === 'All' || e.status === status)
      )
    })
  }, [q, type, status])

  function statusClass(s: EnquiryStatus) {
    if (s === 'New') return 'info'
    if (s === 'In progress') return 'warn'
    return 'muted'
  }

  return (
    <>
      <div className="admin-toolbar">
        <div>
          <h2>Enquiries &amp; requests</h2>
          <p style={{ margin: '0.2rem 0 0', color: '#64748b', fontSize: '0.85rem' }}>
            Sale leads, hire bookings, loan applications, and partnership requests
          </p>
        </div>
        <div className="admin-toolbar-actions">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search enquiries…" />
          <select value={type} onChange={(e) => setType(e.target.value as typeof type)}>
            <option value="All">All types</option>
            <option>Car sale</option>
            <option>Car hire</option>
            <option>Loan</option>
            <option>Partnership</option>
          </select>
          <select value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
            <option value="All">All status</option>
            <option>New</option>
            <option>In progress</option>
            <option>Closed</option>
          </select>
        </div>
      </div>

      <section className="admin-panel">
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Enquiry</th>
                <th>Type</th>
                <th>Customer</th>
                <th>Related</th>
                <th>Assignee</th>
                <th>Created</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filtered.map((enquiry) => (
                <tr key={enquiry.id}>
                  <td>
                    <strong>{enquiry.subject}</strong>
                    <div style={{ color: '#64748b', fontSize: '0.8rem' }}>{enquiry.id.toUpperCase()}</div>
                  </td>
                  <td>
                    <span className="admin-pill muted">{enquiry.type}</span>
                  </td>
                  <td>
                    {enquiry.customer}
                    <div style={{ color: '#64748b', fontSize: '0.8rem' }}>{enquiry.phone}</div>
                  </td>
                  <td>{enquiry.related}</td>
                  <td>{enquiry.assignee}</td>
                  <td>{enquiry.created}</td>
                  <td>
                    <span className={`admin-pill ${statusClass(enquiry.status)}`}>
                      {enquiry.status}
                    </span>
                  </td>
                  <td>
                    <div className="admin-row-actions">
                      <button type="button">Assign</button>
                      <button type="button">
                        {enquiry.status === 'Closed' ? 'Reopen' : 'Close'}
                      </button>
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
