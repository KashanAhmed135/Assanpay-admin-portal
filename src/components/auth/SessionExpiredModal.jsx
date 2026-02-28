export function SessionExpiredModal({ open, onConfirm }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 px-4">
      <div className="w-full max-w-[420px] rounded-2xl border border-[var(--color-border-soft)] bg-[var(--color-surface)] p-6 text-[var(--color-text-primary)] shadow-card">
        <div className="text-lg font-semibold">Session expired</div>
        <div className="mt-2 text-sm text-[var(--color-text-secondary)]">
          Your session expired or you were logged out. Please login again.
        </div>
        <div className="mt-6 flex justify-end">
          <button
            className="h-9 px-4 rounded-xl bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] transition text-xs font-semibold text-white"
            type="button"
            onClick={onConfirm}
          >
            Go to Login
          </button>
        </div>
      </div>
    </div>
  )
}

export default SessionExpiredModal
