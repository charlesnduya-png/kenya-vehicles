/** One-time clear of previously seeded marketplace / billing demo data in localStorage. */
const PURGE_FLAG = 'kv-demo-catalog-purged-v1'

const KEYS_TO_CLEAR = [
  'kv-sale-cars',
  'kv-rental-cars',
  'kv-dealer-subscriptions',
  'kv-lender-subscriptions',
  'kv-agent-subscriptions',
  'kv-account-reports',
  'kv-site-announcements',
  'kv-dealer-logos',
  'kv-loan-partner-logos',
  'kv-loan-partner-profiles',
  'kv-dealer-badges',
  'kv-payment-ledger',
  'kv-customer-reviews',
  'kv-car-offers',
  'kv-yard-enquiries',
  'kv-message-threads',
]

export function purgeDemoCatalogOnce() {
  try {
    if (localStorage.getItem(PURGE_FLAG) === '1') return
    for (const key of KEYS_TO_CLEAR) localStorage.removeItem(key)
    localStorage.setItem(PURGE_FLAG, '1')
  } catch {
    /* ignore private-mode / storage errors */
  }
}
