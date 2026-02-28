import { useSyncExternalStore } from 'react'
import { dismissToast, getToastState, subscribeToast } from '../../utils/toastStore'

export function ToastHost() {
  const getSnapshot = () => getToastState()
  const { toasts } = useSyncExternalStore(subscribeToast, getSnapshot, getSnapshot)

  if (!toasts.length) return null

  return (
    <div className="fixed right-4 top-4 z-[9999] flex flex-col gap-3">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="min-w-[260px] max-w-[360px] rounded-2xl border border-[var(--color-border-soft)] bg-[var(--color-surface)] p-4 shadow-card text-xs text-[var(--color-text-secondary)]"
          role="status"
          aria-live="polite"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="text-[var(--color-text-primary)] text-sm font-semibold">Service notice</div>
            <button
              type="button"
              onClick={() => dismissToast(toast.id)}
              className="text-[10px] uppercase tracking-wide text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
            >
              Dismiss
            </button>
          </div>
          <div className="mt-2">{toast.message}</div>
          {toast.requestId && (
            <div className="mt-2 text-[10px] text-[var(--color-text-secondary)]">
              Request ID: <span className="text-[var(--color-text-primary)] font-semibold">{toast.requestId}</span>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

export default ToastHost
