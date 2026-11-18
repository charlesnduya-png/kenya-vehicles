import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  agentBadgeProducts,
  dealerPlans,
  formatBillingKES,
} from '../data/billing'
import './Pricing.css'

export function Pricing() {
  const [selectedPlan, setSelectedPlan] = useState('plan-growth')
  const [selectedBadge, setSelectedBadge] = useState('badge-monthly')
  const [dealerDone, setDealerDone] = useState(false)
  const [badgeDone, setBadgeDone] = useState(false)

  return (
    <section className="section pricing-page">
      <div className="container">
        <nav className="amz-crumb">
          <Link to="/">Kenya Vehicles</Link>
          <span>›</span>
          <span>Pricing</span>
        </nav>

        <div className="pricing-hero panel-card">
          <div>
            <h1>Subscriptions &amp; verified badges</h1>
            <p>
              Dealers run on monthly plans. Agents can buy a Verified Badge so buyers trust them
              faster — both managed from the Kenya Vehicles platform.
            </p>
          </div>
          <Link to="/join" className="btn btn-primary">
            Open partner application
          </Link>
        </div>

        <div className="pricing-block">
          <div className="pricing-block-head">
            <h2>Dealer monthly subscriptions</h2>
            <p>Required for dealer accounts listing cars for sale on Kenya Vehicles.</p>
          </div>
          <div className="pricing-grid">
            {dealerPlans.map((plan) => (
              <article
                key={plan.id}
                className={`pricing-card ${plan.popular ? 'is-popular' : ''} ${selectedPlan === plan.id ? 'is-selected' : ''}`}
              >
                {plan.popular && <span className="pricing-tag">Most popular</span>}
                <h3>{plan.name}</h3>
                <p className="pricing-amount">
                  {formatBillingKES(plan.monthlyPrice)}
                  <small>/ month</small>
                </p>
                <p className="pricing-limit">
                  {plan.listingLimit === 'Unlimited'
                    ? 'Unlimited listings'
                    : `Up to ${plan.listingLimit} listings`}{' '}
                  · {plan.featuredSlots} featured
                </p>
                <ul>
                  {plan.perks.map((perk) => (
                    <li key={perk}>{perk}</li>
                  ))}
                </ul>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    setSelectedPlan(plan.id)
                    setDealerDone(true)
                  }}
                >
                  {selectedPlan === plan.id && dealerDone ? 'Selected' : 'Choose plan'}
                </button>
              </article>
            ))}
          </div>
          {dealerDone && (
            <div className="pricing-confirm">
              Dealer plan reserved — continue on{' '}
              <Link to="/join">Join as a dealer</Link> to activate billing.
            </div>
          )}
        </div>

        <div className="pricing-block">
          <div className="pricing-block-head">
            <h2>Agent verified badge</h2>
            <p>
              Independent agents and brokers can purchase a Verified Badge. It shows on their
              profile and builds buyer confidence.
            </p>
          </div>
          <div className="pricing-grid pricing-grid-2">
            {agentBadgeProducts.map((product) => (
              <article
                key={product.id}
                className={`pricing-card ${selectedBadge === product.id ? 'is-selected' : ''}`}
              >
                <h3>{product.name}</h3>
                <p className="pricing-amount">
                  {formatBillingKES(product.price)}
                  <small>/ {product.billing === 'Monthly' ? 'month' : 'year'}</small>
                </p>
                <ul>
                  {product.perks.map((perk) => (
                    <li key={perk}>{perk}</li>
                  ))}
                </ul>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    setSelectedBadge(product.id)
                    setBadgeDone(true)
                  }}
                >
                  {selectedBadge === product.id && badgeDone ? 'Selected' : 'Buy verified badge'}
                </button>
              </article>
            ))}
          </div>
          {badgeDone && (
            <div className="pricing-confirm">
              Badge package selected — complete checkout from{' '}
              <Link to="/join#agents">Join as an agent</Link>.
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
