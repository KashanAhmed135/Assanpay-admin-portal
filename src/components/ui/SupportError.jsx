export function SupportError({ error }) {
  if (!error) return null
  const requestId = error.requestId
  const isRetryable = error.isRetryable
  return (
    <div className="rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] p-3 text-xs text-[var(--color-text-secondary)]">
      <div className="font-semibold text-[var(--color-text-primary)]">{error.message || 'Request failed.'}</div>
      {isRetryable && (
        <div className="mt-1 text-[var(--color-text-secondary)]">Temporary issue. Please retry in a moment.</div>
      )}
      {requestId && (
        <div className="mt-2 flex items-center gap-2">
          <span className="text-[11px] text-[var(--color-text-secondary)]">Request ID:</span>
          <span className="text-[11px] font-semibold text-[var(--color-text-primary)]">{requestId}</span>
          <button
            type="button"
            className="h-6 px-2 rounded-lg border border-[var(--color-border-soft)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-muted)] transition text-[10px]"
            onClick={() => navigator.clipboard?.writeText(String(requestId))}
          >
            Copy
          </button>
        </div>
      )}
    </div>
  )
}

export default SupportError
