import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'
import nodemailer from 'nodemailer'
import { randomInt, randomUUID } from 'node:crypto'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, '..', '.env') })

const PORT = Number(process.env.MAIL_API_PORT || 8787)
const GMAIL_USER = (process.env.GMAIL_USER || '').trim()
const GMAIL_APP_PASSWORD = (process.env.GMAIL_APP_PASSWORD || '').replace(/\s+/g, '')
const FROM_NAME = process.env.MAIL_FROM_NAME || 'Kenya Vehicles'

const PAYHERO_BASE = 'https://backend.payhero.co.ke'
const PAYHERO_CHANNEL_ID = Number(process.env.PAYHERO_CHANNEL_ID || 0)
const PAYHERO_ACCOUNT_ID = (process.env.PAYHERO_ACCOUNT_ID || '').trim()
const PAYHERO_CALLBACK_URL = (process.env.PAYHERO_CALLBACK_URL || '').trim()
const SUBSCRIPTION_AMOUNT = Number(process.env.SUBSCRIPTION_AMOUNT_KES || 2000)

function payheroAuthHeader() {
  const raw = (process.env.PAYHERO_BASIC_AUTH || '').trim()
  if (raw) return raw.startsWith('Basic ') ? raw : `Basic ${raw}`
  const user = (process.env.PAYHERO_USERNAME || '').trim()
  const pass = (process.env.PAYHERO_PASSWORD || '').trim()
  if (!user || !pass) return ''
  return `Basic ${Buffer.from(`${user}:${pass}`).toString('base64')}`
}

/** @type {Map<string, { code: string, expiresAt: number, attempts: number }>} */
const codes = new Map()

/**
 * @typedef {{
 *   reference: string,
 *   externalReference: string,
 *   accountId: string,
 *   dealerName: string,
 *   city: string,
 *   phone: string,
 *   amount: number,
 *   status: 'QUEUED' | 'SUCCESS' | 'FAILED' | 'PENDING',
 *   createdAt: number,
 *   mpesaReference?: string,
 * }} PendingPayment
 */

/** @type {Map<string, PendingPayment>} */
const pendingPayments = new Map()

const app = express()
app.use(cors({ origin: true }))
app.use(express.json({ limit: '64kb' }))

function normalizeEmail(email) {
  return String(email || '')
    .trim()
    .toLowerCase()
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function makeCode() {
  return String(randomInt(100000, 1000000))
}

function getTransporter() {
  if (!GMAIL_USER || !GMAIL_APP_PASSWORD) {
    throw new Error(
      'Mail is not configured. Set GMAIL_USER and GMAIL_APP_PASSWORD in the project .env file.',
    )
  }
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: GMAIL_USER,
      pass: GMAIL_APP_PASSWORD,
    },
  })
}

/** Normalize Kenyan mobiles to 07XXXXXXXX / 01XXXXXXXX for PayHero */
function normalizeKenyaPhone(input) {
  let digits = String(input || '').replace(/\D/g, '')
  if (digits.startsWith('254') && digits.length === 12) digits = `0${digits.slice(3)}`
  if (digits.startsWith('2540') && digits.length === 13) digits = digits.slice(3)
  if ((digits.startsWith('7') || digits.startsWith('1')) && digits.length === 9) {
    digits = `0${digits}`
  }
  if (!/^0[17]\d{8}$/.test(digits)) return null
  return digits
}

async function payheroFetch(pathname, options = {}) {
  const auth = payheroAuthHeader()
  if (!auth) throw new Error('PayHero is not configured. Set PAYHERO_BASIC_AUTH in .env.')
  if (!PAYHERO_CHANNEL_ID) throw new Error('PayHero channel missing. Set PAYHERO_CHANNEL_ID in .env.')

  const res = await fetch(`${PAYHERO_BASE}${pathname}`, {
    ...options,
    headers: {
      Authorization: auth,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  })
  const text = await res.text()
  let data = null
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = { raw: text }
  }
  if (!res.ok) {
    const message =
      data?.error_message ||
      data?.message ||
      data?.detail ||
      data?.error ||
      `PayHero request failed (${res.status})`
    const err = new Error(typeof message === 'string' ? message : JSON.stringify(message))
    err.status = res.status
    err.data = data
    throw err
  }
  return data
}

function normalizeStatus(value) {
  const s = String(value || '')
    .trim()
    .toUpperCase()
  if (s === 'SUCCESS' || s === 'SUCCESSFUL' || s === 'COMPLETED') return 'SUCCESS'
  if (s === 'FAILED' || s === 'FAILURE' || s === 'CANCELLED' || s === 'CANCELED') return 'FAILED'
  if (s === 'QUEUED' || s === 'PENDING' || s === 'PROCESSING') return 'QUEUED'
  return s || 'QUEUED'
}

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    mailConfigured: Boolean(GMAIL_USER && GMAIL_APP_PASSWORD),
    from: GMAIL_USER || null,
    payheroConfigured: Boolean(payheroAuthHeader() && PAYHERO_CHANNEL_ID),
    payheroChannelId: PAYHERO_CHANNEL_ID || null,
    payheroAccountId: PAYHERO_ACCOUNT_ID || null,
    subscriptionAmount: SUBSCRIPTION_AMOUNT,
  })
})

app.post('/api/auth/send-code', async (req, res) => {
  try {
    const email = normalizeEmail(req.body?.email)
    const purpose = String(req.body?.purpose || 'account').slice(0, 40)

    if (!isValidEmail(email)) {
      return res.status(400).json({ ok: false, error: 'Enter a valid email address.' })
    }

    const code = makeCode()
    codes.set(`${purpose}:${email}`, {
      code,
      expiresAt: Date.now() + 10 * 60 * 1000,
      attempts: 0,
    })

    const isReset = purpose.startsWith('reset')
    const subject = isReset
      ? `${code} is your Kenya Vehicles password reset code`
      : `${code} is your Kenya Vehicles verification code`
    const intro = isReset
      ? 'Use this code to reset your Kenya Vehicles password:'
      : 'Your Kenya Vehicles verification code is:'

    const transporter = getTransporter()
    await transporter.sendMail({
      from: `"${FROM_NAME}" <${GMAIL_USER}>`,
      to: email,
      subject,
      text: [
        intro.replace(':', ` ${code}`),
        '',
        'This code expires in 10 minutes.',
        'If you did not request this, you can ignore this email.',
      ].join('\n'),
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111">
          <p>${intro}</p>
          <p style="font-size:28px;font-weight:800;letter-spacing:4px">${code}</p>
          <p>This code expires in 10 minutes.</p>
          <p style="color:#666">If you did not request this, you can ignore this email.</p>
        </div>
      `,
    })

    return res.json({
      ok: true,
      message: isReset ? 'Password reset code sent.' : 'Verification code sent.',
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Could not send verification email.'
    console.error('[api] send-code failed:', message)
    return res.status(500).json({ ok: false, error: message })
  }
})

app.post('/api/auth/verify-code', (req, res) => {
  const email = normalizeEmail(req.body?.email)
  const purpose = String(req.body?.purpose || 'account').slice(0, 40)
  const code = String(req.body?.code || '')
    .trim()
    .replace(/\s+/g, '')

  if (!isValidEmail(email) || !/^\d{6}$/.test(code)) {
    return res.status(400).json({ ok: false, error: 'Enter the email and the 6-digit code.' })
  }

  const key = `${purpose}:${email}`
  const entry = codes.get(key)
  if (!entry) {
    return res.status(400).json({ ok: false, error: 'No code found. Request a new verification code.' })
  }
  if (Date.now() > entry.expiresAt) {
    codes.delete(key)
    return res.status(400).json({ ok: false, error: 'That code expired. Request a new one.' })
  }
  entry.attempts += 1
  if (entry.attempts > 8) {
    codes.delete(key)
    return res.status(429).json({ ok: false, error: 'Too many attempts. Request a new code.' })
  }
  if (entry.code !== code) {
    return res.status(400).json({ ok: false, error: 'Incorrect code. Check your email and try again.' })
  }

  codes.delete(key)
  return res.json({ ok: true, verified: true })
})

app.post('/api/payments/stk', async (req, res) => {
  try {
    const phone = normalizeKenyaPhone(req.body?.phone)
    const accountId = String(req.body?.accountId || '').trim()
    const dealerName = String(req.body?.dealerName || 'Dealer').trim().slice(0, 80)
    const city = String(req.body?.city || '').trim().slice(0, 60)
    const amount = Number(req.body?.amount || SUBSCRIPTION_AMOUNT)

    if (!phone) {
      return res.status(400).json({ ok: false, error: 'Enter a valid Kenyan M-Pesa number (07… or 01…).' })
    }
    if (!accountId) {
      return res.status(400).json({ ok: false, error: 'Missing dealer account.' })
    }
    if (!Number.isFinite(amount) || amount < 1) {
      return res.status(400).json({ ok: false, error: 'Invalid payment amount.' })
    }

    const externalReference = `KV-${accountId}-${Date.now().toString(36)}`.slice(0, 40)
    const payload = {
      amount: Math.round(amount),
      phone_number: phone,
      channel_id: PAYHERO_CHANNEL_ID,
      provider: 'm-pesa',
      external_reference: externalReference,
      customer_name: dealerName,
    }
    if (PAYHERO_CALLBACK_URL) payload.callback_url = PAYHERO_CALLBACK_URL

    const data = await payheroFetch('/api/v2/payments', {
      method: 'POST',
      body: JSON.stringify(payload),
    })

    const reference =
      data?.reference ||
      data?.CheckoutRequestID ||
      data?.checkout_request_id ||
      randomUUID()

    /** @type {PendingPayment} */
    const pending = {
      reference: String(reference),
      externalReference,
      accountId,
      dealerName,
      city,
      phone,
      amount: Math.round(amount),
      status: 'QUEUED',
      createdAt: Date.now(),
    }
    pendingPayments.set(pending.reference, pending)
    pendingPayments.set(externalReference, pending)

    console.log(`[api] PayHero STK queued ${pending.reference} → ${phone} KES ${pending.amount}`)

    return res.json({
      ok: true,
      reference: pending.reference,
      externalReference,
      amount: pending.amount,
      phone,
      status: pending.status,
      message: 'M-Pesa prompt sent. Enter your PIN on your phone.',
      payhero: data,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Could not start M-Pesa payment.'
    console.error('[api] PayHero STK failed:', message)
    return res.status(err.status || 500).json({ ok: false, error: message })
  }
})

app.get('/api/payments/status', async (req, res) => {
  try {
    const reference = String(req.query.reference || '').trim()
    if (!reference) {
      return res.status(400).json({ ok: false, error: 'Missing payment reference.' })
    }

    const data = await payheroFetch(
      `/api/v2/transaction-status?reference=${encodeURIComponent(reference)}`,
    )
    const status = normalizeStatus(data?.status)
    const pending = pendingPayments.get(reference)
    if (pending) {
      pending.status = status === 'SUCCESS' || status === 'FAILED' ? status : 'QUEUED'
      if (data?.provider_reference || data?.third_party_reference) {
        pending.mpesaReference = String(data.provider_reference || data.third_party_reference)
      }
    }

    return res.json({
      ok: true,
      reference,
      status,
      paid: status === 'SUCCESS',
      failed: status === 'FAILED',
      mpesaReference: data?.provider_reference || data?.third_party_reference || null,
      accountId: pending?.accountId ?? null,
      amount: pending?.amount ?? null,
      dealerName: pending?.dealerName ?? null,
      city: pending?.city ?? null,
      payhero: data,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Could not check payment status.'
    console.error('[api] PayHero status failed:', message)
    return res.status(err.status || 500).json({ ok: false, error: message })
  }
})

app.post('/api/payments/callback', (req, res) => {
  try {
    const body = req.body || {}
    const response = body.response || body
    const reference = String(
      response.reference || body.reference || response.CheckoutRequestID || '',
    ).trim()
    const externalReference = String(
      response.external_reference || body.external_reference || '',
    ).trim()
    const status = normalizeStatus(response.Status || response.status || body.status)
    const pending =
      (reference && pendingPayments.get(reference)) ||
      (externalReference && pendingPayments.get(externalReference)) ||
      null

    if (pending) {
      pending.status = status === 'SUCCESS' || status === 'FAILED' ? status : pending.status
      pending.mpesaReference = String(
        response.provider_reference || response.MpesaReceiptNumber || pending.mpesaReference || '',
      )
      console.log(`[api] PayHero callback ${pending.reference} → ${pending.status}`)
    } else {
      console.log('[api] PayHero callback for unknown reference', reference || externalReference)
    }

    return res.json({ ok: true })
  } catch (err) {
    console.error('[api] callback error:', err)
    return res.status(200).json({ ok: true })
  }
})

export default app

/** Local / Render long-running process — skipped on Vercel serverless */
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`[api] listening on http://127.0.0.1:${PORT}`)
    if (!GMAIL_USER || !GMAIL_APP_PASSWORD) {
      console.warn('[api] Missing GMAIL_USER or GMAIL_APP_PASSWORD in .env')
    } else {
      console.log(`[api] mail as ${GMAIL_USER}`)
    }
    if (payheroAuthHeader() && PAYHERO_CHANNEL_ID) {
      console.log(`[api] PayHero channel ${PAYHERO_CHANNEL_ID} (account ${PAYHERO_ACCOUNT_ID || '—'})`)
    } else {
      console.warn('[api] PayHero not fully configured')
    }
  })
}
