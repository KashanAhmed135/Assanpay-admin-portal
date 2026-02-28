import { useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { retryCheckoutSession } from '../api/publicPaymentApi'

export function CheckoutFailedPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const search = useMemo(() => new URLSearchParams(location.search), [location.search])
  const reason = search.get('reason') || 'Payment failed. Please try again.'
  const sessionId = search.get('sessionId') || ''
  const [loading, setLoading] = useState(false)

  const handleTryAgain = () => {
    if (!sessionId) {
      navigate('/pay')
      return
    }
    setLoading(true)
    retryCheckoutSession(sessionId)
      .then((res) => {
        const nextId = res?.sessionId
        if (nextId) {
          navigate(`/pay?sessionId=${encodeURIComponent(nextId)}`)
        } else {
          navigate(`/pay?sessionId=${encodeURIComponent(sessionId)}`)
        }
      })
      .catch(() => {
        navigate(`/pay?sessionId=${encodeURIComponent(sessionId)}`)
      })
      .finally(() => setLoading(false))
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)] text-[var(--color-text-primary)]">
      <div className="max-w-xl mx-auto px-4 py-10">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm text-center grid gap-3">
          <div className="text-lg font-semibold text-rose-600">Payment Failed</div>
          <div className="text-sm text-slate-500">{reason}</div>
          <div className="flex items-center justify-center gap-2 pt-2">
            <button
              type="button"
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm text-white"
              onClick={handleTryAgain}
              disabled={loading}
            >
              {loading ? 'Retrying...' : 'Try Again'}
            </button>
            <button
              type="button"
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm"
              onClick={handleTryAgain}
              disabled={loading}
            >
              Change Method
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CheckoutFailedPage
