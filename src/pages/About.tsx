import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import './About.css'

const PHONE_DISPLAY = '0792 268 513'
const PHONE_TEL = '+254792268513'
const EMAIL = 'hello@kenyavehicles.co.ke'

export function About() {
  const { hash } = useLocation()

  useEffect(() => {
    if (!hash) return
    const id = hash.replace('#', '')
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [hash])

  return (
    <section className="section about-page">
      <div className="container">
        <nav className="amz-crumb">
          <Link to="/">Kenya Vehicles</Link>
          <span>›</span>
          <span>Get to Know Us</span>
        </nav>

        <div className="about-hero fade-up">
          <p className="eyebrow">Kenya Vehicles</p>
          <h1>Kenya&apos;s largest car marketplace</h1>
          <p>
            Buy, hire &amp; finance with confidence — verified dealers, hire fleets, and loan
            partners nationwide, all in one place.
          </p>
        </div>

        <div className="about-nav fade-up">
          <a href="#about-dealers">About dealers</a>
          <a href="#architecture">Platform architecture</a>
          <a href="#careers">Careers &amp; partnerships</a>
          <a href="#contact">Contact</a>
        </div>

        <article id="about-dealers" className="about-block panel-card fade-up">
          <h2>About Kenya Vehicles Dealers</h2>
          <p>
            Dealers on Kenya Vehicles list sale stock and hire cars from their yards. Buyers compare
            prices in KES, message yards, leave reviews, and attach loan interest when they are ready
            to finance.
          </p>
          <p>
            Verified yards show a badge on their profile. The dealer subscription is KES 2,000/month
            with unlimited listings when payments are required by admin.
          </p>
          <div className="about-actions">
            <Link to="/dealers" className="btn btn-primary">
              Browse dealers
            </Link>
            <Link to="/join" className="btn btn-ghost">
              Join as a dealer
            </Link>
          </div>
        </article>

        <article id="architecture" className="about-block panel-card fade-up">
          <h2>Platform architecture</h2>
          <p>
            Kenya Vehicles is built in layers: the marketplace UI, APIs, backend services,
            authentication for dealers and loan agents, database and file storage for listings and
            photos, plus hosting, security, and monitoring.
          </p>
          <p>
            A typical listing flow moves from the dealer portal form through the API and backend into
            storage, then appears on Browse, Home, and the dealer page for buyers across Kenya.
          </p>
          <div className="about-actions">
            <Link to="/architecture" className="btn btn-primary">
              View platform architecture
            </Link>
          </div>
        </article>

        <article id="careers" className="about-block panel-card fade-up">
          <h2>Careers &amp; partnerships</h2>
          <p>
            We partner with dealers (yards and brokers on one account type) and loan institutions.
            Dealers can buy a Verified Badge from their account — it renews every 2 months. Lenders
            meet buyers when they pick a car.
          </p>
          <div className="about-actions">
            <Link to="/join" className="btn btn-primary">
              Join as a dealer
            </Link>
            <Link to="/join#lenders" className="btn btn-ghost">
              Lender partnership
            </Link>
            <Link to="/pricing" className="btn btn-ghost">
              Pricing
            </Link>
          </div>
        </article>

        <article id="contact" className="about-block about-contact panel-card fade-up">
          <h2>Contact Kenya Vehicles</h2>
          <p>Reach the Kenya Vehicles team for partnerships, support, or press.</p>
          <dl className="about-contact-list">
            <div>
              <dt>Phone</dt>
              <dd>
                <a href={`tel:${PHONE_TEL}`}>{PHONE_DISPLAY}</a>
              </dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>
                <a href={`mailto:${EMAIL}`}>{EMAIL}</a>
              </dd>
            </div>
            <div>
              <dt>Support</dt>
              <dd>
                <a href="mailto:support@kenyavehicles.co.ke">support@kenyavehicles.co.ke</a>
              </dd>
            </div>
          </dl>
          <div className="about-actions">
            <a href={`tel:${PHONE_TEL}`} className="btn btn-primary">
              Call {PHONE_DISPLAY}
            </a>
            <a href={`mailto:${EMAIL}`} className="btn btn-ghost">
              Email us
            </a>
          </div>
        </article>
      </div>
    </section>
  )
}
