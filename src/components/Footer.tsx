import { Link } from 'react-router-dom'
import { BrandLogo } from './BrandLogo'
import './Footer.css'

export function Footer() {
  function scrollTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <footer className="amz-footer">
      <button type="button" className="amz-back-top" onClick={scrollTop}>
        Back to top
      </button>

      <div className="amz-footer-main">
        <div className="container amz-footer-grid">
          <div>
            <h4>Get to Know Us</h4>
            <Link to="/dealers">About Kenya Vehicles Dealers</Link>
            <Link to="/architecture">Platform architecture</Link>
            <Link to="/join">Careers &amp; Partnerships</Link>
            <a href="mailto:hello@kenyavehicles.co.ke">Contact Kenya Vehicles</a>
          </div>
          <div>
            <h4>Make Money with Us</h4>
            <Link to="/join">Sell cars on Kenya Vehicles</Link>
            <Link to="/pricing">Dealer subscriptions</Link>
            <Link to="/join#agents">Buy agent verified badge</Link>
            <Link to="/join#lenders">Offer car loans</Link>
          </div>
          <div>
            <h4>Car Loans &amp; Payment</h4>
            <Link to="/loans">Compare loan partners</Link>
            <Link to="/loans">Monthly payment calculator</Link>
            <Link to="/cars">Shop cars with finance</Link>
          </div>
          <div>
            <h4>Let Us Help You</h4>
            <Link to="/cars">Your car searches</Link>
            <Link to="/messages">Your messages</Link>
            <Link to="/dealers">Find a yard near you</Link>
            <Link to="/report">Report an account</Link>
            <Link to="/login">Dealer sign in</Link>
            <Link to="/admin">Admin console</Link>
            <span>Help: support@kenyavehicles.co.ke</span>
          </div>
        </div>
      </div>

      <div className="amz-footer-brand">
        <BrandLogo />
        <p>Kenya&apos;s multi-dealer car marketplace · Prices in KES</p>
      </div>

      <div className="amz-footer-legal">
        <span>© {new Date().getFullYear()} Kenya Vehicles</span>
        <span>Conditions of Use · Privacy Notice</span>
      </div>
    </footer>
  )
}
