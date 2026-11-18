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
            <Link to="/about#about-dealers">About Kenya Vehicles Dealers</Link>
            <Link to="/about#architecture">Platform architecture</Link>
            <Link to="/about#careers">Careers &amp; Partnerships</Link>
            <Link to="/about#contact">Contact Kenya Vehicles</Link>
            <a href="tel:+254792268513">Call 0792 268 513</a>
          </div>
          <div>
            <h4>Make Money with Us</h4>
            <Link to="/join">Sell cars on Kenya Vehicles</Link>
            <Link to="/pricing">Dealer subscriptions</Link>
            <Link to="/pricing">Buy verified dealer badge</Link>
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
            <a href="tel:+254792268513">Help: 0792 268 513</a>
            <span>Email: support@kenyavehicles.co.ke</span>
          </div>
        </div>
      </div>

      <div className="amz-footer-brand">
        <BrandLogo />
        <p>Kenya&apos;s largest car marketplace — buy, hire &amp; finance · Prices in KES</p>
      </div>

      <div className="amz-footer-legal">
        <span>© {new Date().getFullYear()} Kenya Vehicles</span>
        <span>Conditions of Use · Privacy Notice</span>
      </div>
    </footer>
  )
}
