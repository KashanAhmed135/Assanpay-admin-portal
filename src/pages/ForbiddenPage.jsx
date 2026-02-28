import { useLocation, Link } from 'react-router-dom'

export function ForbiddenPage() {
  const location = useLocation()
  const missing = location.state?.missing || location.state?.reason

  return (
    <div className="min-h-screen grid place-items-center bg-[var(--color-bg-primary)] px-6 text-[var(--color-text-primary)]">
      <div className="max-w-lg w-full rounded-2xl border border-[var(--color-border-soft)] bg-[var(--color-surface)] p-6 shadow-card">
        <div className="text-lg font-semibold">Access denied</div>
        <div className="mt-2 text-sm text-[var(--color-text-secondary)]">
          You do not have permission to view this page.
        </div>
        {missing && (
          <div className="mt-3 text-xs text-[var(--color-text-secondary)]">
            Missing permission: <span className="font-semibold">{missing}</span>
          </div>
        )}
        <div className="mt-6 flex items-center gap-3">
          <Link
            to="/"
            className="h-9 px-4 rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] hover:bg-[var(--color-surface)] transition text-xs"
          >
            Go to Home
          </Link>
        </div>
      </div>
    </div>
  )
}

export default ForbiddenPage
