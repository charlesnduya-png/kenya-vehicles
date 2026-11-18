import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ReportAccountModal } from '../components/ReportAccountModal'
import { dealers } from '../data/dealers'
import type { ReportTargetType } from '../data/reports'
import './ReportAccount.css'

type TargetOption = {
  id: string
  name: string
  type: ReportTargetType
  meta: string
}

export function ReportAccount() {
  const options = useMemo<TargetOption[]>(
    () =>
      dealers.map((d) => ({
        id: d.id,
        name: d.name,
        type: 'Dealer' as const,
        meta: `${d.city} · Dealer`,
      })),
    [],
  )

  const [selectedKey, setSelectedKey] = useState(
    () => (options[0] ? `${options[0].type}:${options[0].id}` : ''),
  )
  const [open, setOpen] = useState(false)
  const selected = options.find((o) => `${o.type}:${o.id}` === selectedKey) ?? options[0]

  return (
    <section className="section report-page">
      <div className="container report-page-inner">
        <nav className="amz-crumb">
          <Link to="/">Home</Link>
          <span>/</span>
          <span>Report an account</span>
        </nav>

        <div className="report-page-card panel-card">
          <p className="eyebrow">Trust &amp; safety</p>
          <h1>Report an account</h1>
          <p>
            Tell us about a dealer or other Kenya Vehicles account that may be breaking our rules.
            Our team reviews every report.
          </p>

          <div className="field" style={{ marginTop: '1.25rem' }}>
            <label htmlFor="report-target">Account to report</label>
            <select
              id="report-target"
              value={selectedKey}
              onChange={(e) => setSelectedKey(e.target.value)}
            >
              {options.map((o) => (
                <option key={`${o.type}-${o.id}`} value={`${o.type}:${o.id}`}>
                  {o.name} — {o.meta}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            className="btn btn-primary"
            style={{ marginTop: '1rem' }}
            disabled={!selected}
            onClick={() => setOpen(true)}
          >
            Continue
          </button>
        </div>
      </div>

      {selected && (
        <ReportAccountModal
          open={open}
          onClose={() => setOpen(false)}
          targetType={selected.type}
          targetId={selected.id}
          targetName={selected.name}
        />
      )}
    </section>
  )
}
