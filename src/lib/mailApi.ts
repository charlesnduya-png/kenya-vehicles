const API_BASE = ''

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = (await res.json().catch(() => ({}))) as T & { ok?: boolean; error?: string }
  if (!res.ok || (data && 'ok' in data && data.ok === false)) {
    throw new Error(data.error || `Request failed (${res.status})`)
  }
  return data
}

export function sendVerificationCode(email: string, purpose = 'account') {
  return postJson<{ ok: true; message: string }>('/api/auth/send-code', { email, purpose })
}

export function verifyEmailCode(email: string, code: string, purpose = 'account') {
  return postJson<{ ok: true; verified: true }>('/api/auth/verify-code', { email, code, purpose })
}
