import { type FormEvent, useEffect, useMemo, useState } from 'react'
import { getCustomerIdentity } from '../data/messages'
import {
  addReview,
  getDealerReviewStats,
  getReviewsForDealer,
  getReviewsForTarget,
  subscribeReviews,
  type ReviewTargetType,
} from '../data/reviews'
import './CustomerReviews.css'

type Props = {
  dealerId: string
  dealerName: string
  seedRating: number
  seedCount: number
  targetType?: ReviewTargetType
  targetId?: string
  relatedLabel?: string
}

function starsLabel(n: number) {
  return '★'.repeat(n) + '☆'.repeat(5 - n)
}

export function CustomerReviews({
  dealerId,
  dealerName,
  seedRating,
  seedCount,
  targetType = 'Dealer',
  targetId,
  relatedLabel,
}: Props) {
  const resolvedTargetId = targetId ?? dealerId
  const identity = getCustomerIdentity()
  const [reviews, setReviews] = useState(() => getReviewsForDealer(dealerId))
  const [name, setName] = useState(identity?.name ?? '')
  const [phone, setPhone] = useState(identity?.phone && identity.phone !== 'guest' ? identity.phone : '')
  const [rating, setRating] = useState(5)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    return subscribeReviews(() => setReviews(getReviewsForDealer(dealerId)))
  }, [dealerId])

  const stats = useMemo(
    () => getDealerReviewStats(dealerId, seedRating, seedCount),
    [dealerId, seedRating, seedCount, reviews],
  )

  const visible = useMemo(() => {
    if (targetType === 'Dealer') return reviews
    const direct = getReviewsForTarget(targetType, resolvedTargetId)
    return direct.length ? direct : reviews
  }, [reviews, targetType, resolvedTargetId])

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    try {
      addReview({
        targetType,
        targetId: resolvedTargetId,
        dealerId,
        rating,
        title,
        body,
        authorName: name,
        authorPhone: phone,
        relatedLabel,
      })
      setDone(true)
      setTitle('')
      setBody('')
      setRating(5)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save review.')
    }
  }

  return (
    <section className="customer-reviews">
      <div className="customer-reviews-head">
        <div>
          <p className="eyebrow">Reviews</p>
          <h2>What buyers say about {dealerName}</h2>
          <p>No sign-in needed — leave a review with your name.</p>
        </div>
        <div className="customer-reviews-score">
          <strong>★ {stats.average.toFixed(1)}</strong>
          <span>
            {stats.count} review{stats.count === 1 ? '' : 's'}
            {stats.customerCount > 0 ? ` · ${stats.customerCount} from shoppers` : ''}
          </span>
        </div>
      </div>

      <div className="customer-reviews-grid">
        <div className="panel-card customer-reviews-list">
          {visible.length === 0 ? (
            <p className="customer-reviews-empty">
              No shopper reviews yet. Be the first — you do not need an account.
            </p>
          ) : (
            visible.map((review) => (
              <article key={review.id} className="customer-review-item">
                <div className="customer-review-meta">
                  <strong>{review.authorName}</strong>
                  <span className="customer-review-stars" aria-label={`${review.rating} stars`}>
                    {starsLabel(review.rating)}
                  </span>
                  <time dateTime={review.createdAt}>
                    {new Date(review.createdAt).toLocaleDateString()}
                  </time>
                  {review.relatedLabel && <em>{review.relatedLabel}</em>}
                </div>
                {review.title && <h3>{review.title}</h3>}
                <p>{review.body}</p>
              </article>
            ))
          )}
        </div>

        <div className="panel-card customer-reviews-form">
          {done ? (
            <div className="customer-reviews-success">
              Thanks — your review is live. No login was required.
            </div>
          ) : (
            <form onSubmit={onSubmit}>
              <h3>Write a review</h3>
              <p>Share your experience. Guests can review without creating an account.</p>

              <div className="customer-reviews-stars-pick" role="group" aria-label="Star rating">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    className={n <= rating ? 'is-on' : undefined}
                    onClick={() => setRating(n)}
                    aria-label={`${n} star${n === 1 ? '' : 's'}`}
                  >
                    {'★'.repeat(n)}
                  </button>
                ))}
              </div>

              <div className="grid-2">
                <div className="field">
                  <label htmlFor={`rev-name-${resolvedTargetId}`}>Your name</label>
                  <input
                    id={`rev-name-${resolvedTargetId}`}
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Jane Wanjiku"
                  />
                </div>
                <div className="field">
                  <label htmlFor={`rev-phone-${resolvedTargetId}`}>Phone (optional)</label>
                  <input
                    id={`rev-phone-${resolvedTargetId}`}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+254 7.."
                  />
                </div>
              </div>

              <div className="field" style={{ marginTop: '0.75rem' }}>
                <label htmlFor={`rev-title-${resolvedTargetId}`}>Title (optional)</label>
                <input
                  id={`rev-title-${resolvedTargetId}`}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Smooth handover"
                />
              </div>

              <div className="field" style={{ marginTop: '0.75rem' }}>
                <label htmlFor={`rev-body-${resolvedTargetId}`}>Your review</label>
                <textarea
                  id={`rev-body-${resolvedTargetId}`}
                  required
                  rows={4}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="How was the yard, the car, and the process?"
                />
              </div>

              {error && (
                <p style={{ color: '#b91c1c', fontWeight: 700, marginTop: '0.65rem' }}>{error}</p>
              )}

              <button type="submit" className="btn btn-primary" style={{ marginTop: '0.85rem' }}>
                Post review
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  )
}
