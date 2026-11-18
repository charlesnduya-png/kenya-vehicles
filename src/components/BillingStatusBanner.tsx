import { Link } from 'react-router-dom'
import type { BillingAccess } from '../data/billingAccess'

export function BillingStatusBanner({
  access,
  payPath,
}: {
  access: BillingAccess
  payPath: string
}) {
  if (access.state === 'free' || access.state === 'paid') return null

  const frozen = access.state === 'frozen'
  const grace = access.state === 'grace'
  const unpaid = access.state === 'unpaid'

  return (
    <div
      className={`billing-banner ${frozen ? 'is-frozen' : grace ? 'is-grace' : 'is-unpaid'}`}
      role="status"
    >
      <div>
        <strong>
          {frozen
            ? 'Listing frozen'
            : grace
              ? '3-day payment advance'
              : unpaid
                ? 'Free account — pay to post'
                : 'Payment required'}
        </strong>
        <p>{access.message}</p>
      </div>
      <Link to={payPath} className="admin-btn admin-btn-primary">
        {unpaid ? 'View monthly plan' : 'Pay now'}
      </Link>
    </div>
  )
}
