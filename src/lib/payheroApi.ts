export type StkStartResult = {
  ok: true
  reference: string
  externalReference: string
  amount: number
  phone: string
  status: string
  message: string
}

export type PaymentStatusResult = {
  ok: true
  reference: string
  status: string
  paid: boolean
  failed: boolean
  mpesaReference: string | null
  accountId: string | null
  amount: number | null
  dealerName: string | null
  city: string | null
}

async function parseJson<T>(res: Response): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { ok?: boolean; error?: string }
  if (!res.ok || (data && 'ok' in data && data.ok === false)) {
    throw new Error(data.error || `Request failed (${res.status})`)
  }
  return data
}

export function startSubscriptionStk(input: {
  phone: string
  accountId: string
  dealerName: string
  city: string
  amount?: number
  partnerKind?: 'dealer' | 'lender'
}) {
  return fetch('/api/payments/stk', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  }).then((res) => parseJson<StkStartResult>(res))
}

export function getPaymentStatus(reference: string) {
  return fetch(`/api/payments/status?reference=${encodeURIComponent(reference)}`).then((res) =>
    parseJson<PaymentStatusResult>(res),
  )
}
