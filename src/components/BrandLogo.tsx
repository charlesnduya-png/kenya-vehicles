import { Link } from 'react-router-dom'
import './BrandLogo.css'

export function BrandLogo({ onClick }: { onClick?: () => void }) {
  return (
    <Link to="/" className="brand" onClick={onClick} aria-label="Kenya Vehicles home">
      <span className="brand-bg" aria-hidden="true">
        <img src="/images/kenya-flag-map.webp" alt="" />
      </span>
      <span className="brand-wordmark">
        <span className="brand-kenya">KENYA</span>
        <span className="brand-vehicles">
          Vehicles
          <span className="brand-curve" aria-hidden="true" />
        </span>
      </span>
    </Link>
  )
}
