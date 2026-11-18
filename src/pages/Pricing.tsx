import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  SUBSCRIPTION_PRICE_KES,
  dealerPlans,
  formatBillingKES,
} from '../data/billing'
import {
  VERIFIED_BADGE_DURATION_MONTHS,
  verifiedBadgeProduct,
} from '../data/dealerBadges'
import {
  getPlatformSettings,
  subscribePlatformSettings,
} from '../data/platformSettings'
import './Pricing.css'

export function Pricing() {
  const [selectedPlan, setSelectedPlan] = useState(dealerPlans[0]?.id ?? 'plan-dealer')
  const [dealerDone, setDealerDone] = useState(false)
  const [badgeDone, setBadgeDone] = useState(false)
  const [paymentsRequired, setPaymentsRequired] = useState(
    () => getPlatformSettings().paymentsRequired,
  )

  useEffect(() => {
    const refresh = () => setPaymentsRequired(getPlatformSettings().paymentsRequired)
    refresh()
    return subscribePlatformSettings(refresh)
  }, [])

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
            <h1>Dealer plans &amp; verified badge</h1>
            <p>
              One dealer account for yards and brokers. Create free, then pay{' '}
              {formatBillingKES(SUBSCRIPTION_PRICE_KES)}/month only to post listings. Buy a Verified
              Badge from your account — renews every {VERIFIED_BADGE_DURATION_MONTHS} months.
              {!paymentsRequired &&
                ' Right now payments are off — dealers can list for free until admin turns them on.'}
            </p>
          </div>
          <Link to="/join" className="btn btn-primary">
            Create free dealer account
          </Link>
        </div>

        <div className="pricing-block">
          <div className="pricing-block-head">
            <h2>Monthly listing subscription</h2>
            <p>
              {paymentsRequired
                ? 'Accounts are free. This monthly plan unlocks posting sale and hire cars.'
                : 'Standard monthly plan — posting is free while the payment switch is off.'}
            </p>
          </div>
          <div className="pricing-grid">
            {dealerPlans.map((plan) => (
              <article
                key={plan.id}
                className={`pricing-card ${plan.popular ? 'is-popular' : ''} ${selectedPlan === plan.id ? 'is-selected' : ''}`}
              >
                {plan.popular && <span className="pricing-tag">Dealers</span>}
                <h3>{plan.name}</h3>
                <p className="pricing-amount">
                  {formatBillingKES(plan.monthlyPrice)}
                  <small>/ month</small>
                </p>
                <p className="pricing-limit">Unlimited listings · {plan.featuredSlots} featured</p>
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
              Plan noted — <Link to="/join">create your free dealer account</Link>, then pay from
              Subscription when you post.
            </div>
          )}
        </div>

        <div className="pricing-block">
          <div className="pricing-block-head">
            <h2>Verified dealer badge</h2>
            <p>
              Optional trust badge for any dealer account. Buy or renew inside Dealer → Subscription.
              Valid for {VERIFIED_BADGE_DURATION_MONTHS} months, then renew.
            </p>
          </div>
          <div className="pricing-grid pricing-grid-2">
            <article className={`pricing-card ${badgeDone ? 'is-selected' : ''}`}>
              <h3>{verifiedBadgeProduct.name}</h3>
              <p className="pricing-amount">
                {formatBillingKES(verifiedBadgeProduct.price)}
                <small>/ {VERIFIED_BADGE_DURATION_MONTHS} months</small>
              </p>
              <ul>
                {verifiedBadgeProduct.perks.map((perk) => (
                  <li key={perk}>{perk}</li>
                ))}
              </ul>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setBadgeDone(true)}
              >
                {badgeDone ? 'Selected' : 'Get verified badge'}
              </button>
            </article>
          </div>
          {badgeDone && (
            <div className="pricing-confirm">
              After you join, open <Link to="/login">Dealer → Subscription</Link> to buy or renew
              the badge with M-Pesa.
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
