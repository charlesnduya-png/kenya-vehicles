import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { agentBadgeProducts, dealerPlans, formatBillingKES } from '../data/billing'
import './Join.css'

type Tab = 'dealer' | 'agent' | 'lender'

function initialTab(): Tab {
  if (typeof window === 'undefined') return 'dealer'
  if (window.location.hash === '#lenders') return 'lender'
  if (window.location.hash === '#agents') return 'agent'
  return 'dealer'
}

export function Join() {
  const [tab, setTab] = useState<Tab>(initialTab)
  const [submitted, setSubmitted] = useState(false)
  const [planId, setPlanId] = useState('plan-growth')
  const [badgeId, setBadgeId] = useState('badge-monthly')

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitted(true)
  }

  const title =
    tab === 'dealer' ? 'Dealer application' : tab === 'agent' ? 'Agent application' : 'Lender application'

  return (
    <section className="section join-page">
      <div className="container">
        <div className="join-head fade-up">
          <p className="eyebrow">Grow with Kenya Vehicles</p>
          <h1>Dealers, agents &amp; lenders — nationwide</h1>
          <p>
            Dealer accounts run on monthly subscriptions. Agents can buy a Verified Badge. Loan
            partners connect buyers to financing. See{' '}
            <Link to="/pricing">full pricing</Link>.
          </p>
        </div>

        <div className="join-tabs fade-up">
          <button
            type="button"
            className={tab === 'dealer' ? 'is-active' : undefined}
            onClick={() => {
              setTab('dealer')
              setSubmitted(false)
            }}
          >
            Dealer
          </button>
          <button
            type="button"
            id="agents"
            className={tab === 'agent' ? 'is-active' : undefined}
            onClick={() => {
              setTab('agent')
              setSubmitted(false)
            }}
          >
            Agent
          </button>
          <button
            type="button"
            id="lenders"
            className={tab === 'lender' ? 'is-active' : undefined}
            onClick={() => {
              setTab('lender')
              setSubmitted(false)
            }}
          >
            Lender
          </button>
        </div>

        <div className="join-layout">
          <div className="join-benefits fade-up">
            {tab === 'dealer' && (
              <>
                <h2>Dealer monthly subscription</h2>
                <ul>
                  <li>Required monthly plan to keep your yard listings live</li>
                  <li>Starter, Growth, or Enterprise based on stock size</li>
                  <li>Featured slots and loan attach on paid plans</li>
                  <li>Cancel or upgrade anytime from billing</li>
                </ul>
                <p className="join-pricing-note">
                  From {formatBillingKES(dealerPlans[0].monthlyPrice)}/month ·{' '}
                  <Link to="/pricing">Compare plans</Link>
                </p>
              </>
            )}
            {tab === 'agent' && (
              <>
                <h2>Buy a Verified Agent Badge</h2>
                <ul>
                  <li>Show a Verified badge on your agent profile</li>
                  <li>Rank higher in buyer search results</li>
                  <li>Monthly or annual badge packages</li>
                  <li>Build trust without a full dealership yard</li>
                </ul>
                <p className="join-pricing-note">
                  From {formatBillingKES(agentBadgeProducts[0].price)}/month ·{' '}
                  <Link to="/pricing">Badge packages</Link>
                </p>
              </>
            )}
            {tab === 'lender' && (
              <>
                <h2>Why lenders join Kenya Vehicles</h2>
                <ul>
                  <li>Meet buyers at the moment they pick a car</li>
                  <li>Partner with subscribed dealers for cleaner collateral</li>
                  <li>Show rates, deposit rules, and cities you serve</li>
                  <li>Capture applications alongside marketplace traffic</li>
                </ul>
              </>
            )}
          </div>

          <form className="join-form fade-up fade-up-delay-1" onSubmit={onSubmit}>
            <h2>{title}</h2>
            {submitted ? (
              <div className="enquire-success">
                {tab === 'dealer' &&
                  'Thanks — we will activate your dealer subscription after review (1–2 business days).'}
                {tab === 'agent' &&
                  'Thanks — complete verified badge payment and we will issue your badge shortly.'}
                {tab === 'lender' &&
                  'Thanks — Kenya Vehicles partnerships will contact you within 1–2 business days.'}
              </div>
            ) : (
              <>
                <div className="grid-2">
                  <div className="field">
                    <label htmlFor="biz">{tab === 'agent' ? 'Agent / trade name' : 'Business name'}</label>
                    <input id="biz" required placeholder="Your company" />
                  </div>
                  <div className="field">
                    <label htmlFor="city">City</label>
                    <input id="city" required placeholder="Nairobi" />
                  </div>
                </div>
                <div className="grid-2" style={{ marginTop: '0.85rem' }}>
                  <div className="field">
                    <label htmlFor="contact">Contact person</label>
                    <input id="contact" required placeholder="Full name" />
                  </div>
                  <div className="field">
                    <label htmlFor="phone">Phone</label>
                    <input id="phone" required placeholder="+254 7.." />
                  </div>
                </div>
                <div className="field" style={{ marginTop: '0.85rem' }}>
                  <label htmlFor="email">Work email</label>
                  <input id="email" type="email" required placeholder="you@company.co.ke" />
                </div>

                {tab === 'dealer' && (
                  <div className="field" style={{ marginTop: '0.85rem' }}>
                    <label htmlFor="plan">Monthly subscription plan</label>
                    <select
                      id="plan"
                      value={planId}
                      onChange={(e) => setPlanId(e.target.value)}
                    >
                      {dealerPlans.map((plan) => (
                        <option key={plan.id} value={plan.id}>
                          {plan.name} — {formatBillingKES(plan.monthlyPrice)}/mo
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {tab === 'agent' && (
                  <div className="field" style={{ marginTop: '0.85rem' }}>
                    <label htmlFor="badge">Verified badge package</label>
                    <select
                      id="badge"
                      value={badgeId}
                      onChange={(e) => setBadgeId(e.target.value)}
                    >
                      {agentBadgeProducts.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.billing} — {formatBillingKES(product.price)}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {tab === 'lender' && (
                  <div className="field" style={{ marginTop: '0.85rem' }}>
                    <label htmlFor="type">Institution type</label>
                    <select id="type" defaultValue="Bank">
                      <option>Bank</option>
                      <option>Sacco</option>
                      <option>Microfinance</option>
                      <option>Fintech</option>
                    </select>
                  </div>
                )}

                <div className="field" style={{ marginTop: '0.85rem' }}>
                  <label htmlFor="notes">Anything we should know?</label>
                  <textarea
                    id="notes"
                    placeholder={
                      tab === 'agent'
                        ? 'Areas you cover, brands you sell…'
                        : 'Branches, brands, typical loan sizes…'
                    }
                  />
                </div>
                <button type="submit" className="btn btn-primary" style={{ marginTop: '1.1rem' }}>
                  {tab === 'dealer'
                    ? 'Start subscription application'
                    : tab === 'agent'
                      ? 'Apply & buy verified badge'
                      : 'Submit application'}
                </button>
              </>
            )}
          </form>
        </div>
      </div>
    </section>
  )
}
