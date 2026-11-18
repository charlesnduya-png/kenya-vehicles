export type MessageSender = 'customer' | 'dealer'

export type ChatMessage = {
  id: string
  sender: MessageSender
  text: string
  createdAt: string
}

export type MessageThread = {
  id: string
  dealerId: string
  dealerName: string
  carId?: string
  carLabel?: string
  customerName: string
  customerPhone: string
  customerEmail: string
  updatedAt: string
  messages: ChatMessage[]
}

export type CustomerIdentity = {
  name: string
  phone: string
  email: string
}

const THREADS_KEY = 'kv-message-threads'
const IDENTITY_KEY = 'kv-customer-identity'
const EVENT = 'kv-messages-changed'

function readThreads(): MessageThread[] {
  try {
    const raw = localStorage.getItem(THREADS_KEY)
    if (!raw) return []
    return JSON.parse(raw) as MessageThread[]
  } catch {
    return []
  }
}

function writeThreads(list: MessageThread[]) {
  localStorage.setItem(THREADS_KEY, JSON.stringify(list))
  window.dispatchEvent(new Event(EVENT))
}

export function getCustomerIdentity(): CustomerIdentity | null {
  try {
    const raw = localStorage.getItem(IDENTITY_KEY)
    if (!raw) return null
    return JSON.parse(raw) as CustomerIdentity
  } catch {
    return null
  }
}

export function setCustomerIdentity(identity: CustomerIdentity) {
  localStorage.setItem(IDENTITY_KEY, JSON.stringify(identity))
  window.dispatchEvent(new Event(EVENT))
}

export function getThreads() {
  return readThreads().sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  )
}

export function getThread(id: string) {
  return readThreads().find((t) => t.id === id)
}

export function getThreadsForCustomer(phone: string) {
  const key = phone.trim().toLowerCase()
  return getThreads().filter((t) => t.customerPhone.trim().toLowerCase() === key)
}

export function getThreadsForDealer(dealerId: string) {
  return getThreads().filter((t) => t.dealerId === dealerId)
}

export function startOrContinueThread(input: {
  dealerId: string
  dealerName: string
  carId?: string
  carLabel?: string
  customerName: string
  customerPhone: string
  customerEmail: string
  text: string
}) {
  const identity: CustomerIdentity = {
    name: input.customerName.trim(),
    phone: input.customerPhone.trim(),
    email: input.customerEmail.trim(),
  }
  setCustomerIdentity(identity)

  const list = readThreads()
  const existing = list.find(
    (t) =>
      t.dealerId === input.dealerId &&
      t.customerPhone.trim().toLowerCase() === identity.phone.toLowerCase() &&
      (t.carId ?? '') === (input.carId ?? ''),
  )

  const message: ChatMessage = {
    id: `m-${Date.now()}`,
    sender: 'customer',
    text: input.text.trim(),
    createdAt: new Date().toISOString(),
  }

  if (existing) {
    existing.messages.push(message)
    existing.updatedAt = message.createdAt
    existing.customerName = identity.name
    existing.customerEmail = identity.email
    writeThreads([existing, ...list.filter((t) => t.id !== existing.id)])
    return existing
  }

  const thread: MessageThread = {
    id: `th-${Date.now()}`,
    dealerId: input.dealerId,
    dealerName: input.dealerName,
    carId: input.carId,
    carLabel: input.carLabel,
    customerName: identity.name,
    customerPhone: identity.phone,
    customerEmail: identity.email,
    updatedAt: message.createdAt,
    messages: [message],
  }
  writeThreads([thread, ...list])
  return thread
}

export function replyToThread(threadId: string, sender: MessageSender, text: string) {
  const list = readThreads()
  const thread = list.find((t) => t.id === threadId)
  if (!thread) return null

  const message: ChatMessage = {
    id: `m-${Date.now()}`,
    sender,
    text: text.trim(),
    createdAt: new Date().toISOString(),
  }
  thread.messages.push(message)
  thread.updatedAt = message.createdAt
  writeThreads([thread, ...list.filter((t) => t.id !== threadId)])
  return thread
}

export function subscribeMessages(listener: () => void) {
  window.addEventListener(EVENT, listener)
  window.addEventListener('storage', listener)
  return () => {
    window.removeEventListener(EVENT, listener)
    window.removeEventListener('storage', listener)
  }
}
