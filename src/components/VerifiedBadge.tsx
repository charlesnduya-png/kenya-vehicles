import './VerifiedBadge.css'

export function VerifiedBadge({
  title = 'Verified',
  size = 16,
}: {
  title?: string
  size?: number
}) {
  return (
    <span className="ig-verified" title={title} aria-label={title} role="img">
      <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="12" fill="#1D9BF0" />
        <path
          d="M10.2 15.7l-3.1-3.1 1.2-1.2 1.9 1.9 5-5 1.2 1.2-6.2 6.2z"
          fill="#fff"
        />
      </svg>
    </span>
  )
}
