import { getCustomerIdentity, setCustomerIdentity } from './messages'

export type ReviewTargetType = 'Dealer' | 'Car' | 'Rental'

export type CustomerReview = {
  id: string
  targetType: ReviewTargetType
  targetId: string
  dealerId: string
  rating: number
  title: string
  body: string
  authorName: string
  authorPhone?: string
  relatedLabel?: string
  createdAt: string
}

const STORAGE_KEY = 'kv-customer-reviews'
const EVENT = 'kv-reviews-changed'

function read(): CustomerReview[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as CustomerReview[]
  } catch {
    return []
  }
}

function write(list: CustomerReview[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
  window.dispatchEvent(new Event(EVENT))
}

export function getReviews() {
  return read().sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )
}

export function getReviewsForDealer(dealerId: string) {
  return getReviews().filter((r) => r.dealerId === dealerId)
}

export function getReviewsForTarget(targetType: ReviewTargetType, targetId: string) {
  return getReviews().filter((r) => r.targetType === targetType && r.targetId === targetId)
}

export function getDealerReviewStats(dealerId: string, seedRating = 0, seedCount = 0) {
  const list = getReviewsForDealer(dealerId)
  if (list.length === 0) {
    return {
      average: seedRating,
      count: seedCount,
      customerCount: 0,
    }
  }
  const sum = list.reduce((acc, r) => acc + r.rating, 0)
  const customerAverage = sum / list.length
  const totalCount = seedCount + list.length
  const average =
    totalCount > 0
      ? (seedRating * seedCount + customerAverage * list.length) / totalCount
      : customerAverage
  return {
    average: Math.round(average * 10) / 10,
    count: totalCount,
    customerCount: list.length,
  }
}

export type NewReviewInput = {
  targetType: ReviewTargetType
  targetId: string
  dealerId: string
  rating: number
  title?: string
  body: string
  authorName: string
  authorPhone?: string
  authorEmail?: string
  relatedLabel?: string
}

export function addReview(input: NewReviewInput) {
  const rating = Math.min(5, Math.max(1, Math.round(input.rating)))
  const name = input.authorName.trim() || 'Customer'
  const phone = input.authorPhone?.trim()
  const email = input.authorEmail?.trim()
  const body = input.body.trim()
  if (!body) throw new Error('Review text is required')

  if (phone || email) {
    const existing = getCustomerIdentity()
    setCustomerIdentity({
      name,
      phone: phone || existing?.phone || 'guest',
      email: email || existing?.email || `${(phone || name).replace(/\s/g, '')}@customer.local`,
    })
  }

  const review: CustomerReview = {
    id: `rev-${Date.now()}`,
    targetType: input.targetType,
    targetId: input.targetId,
    dealerId: input.dealerId,
    rating,
    title: input.title?.trim() || '',
    body,
    authorName: name,
    authorPhone: phone || undefined,
    relatedLabel: input.relatedLabel?.trim() || undefined,
    createdAt: new Date().toISOString(),
  }

  write([review, ...read()])
  return review
}

export function subscribeReviews(listener: () => void) {
  window.addEventListener(EVENT, listener)
  window.addEventListener('storage', listener)
  return () => {
    window.removeEventListener(EVENT, listener)
    window.removeEventListener('storage', listener)
  }
}
