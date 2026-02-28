import { useCallback, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { fetchPaymentStatus } from '../api/publicPaymentApi'

export function CheckoutPendingPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const search = useMemo(() => new URLSearchParams(location.search), [location.search])
  const sessionId = search.get('sessionId') || ''
  const paymentId = search.get('paymentId') || ''
  const returnUrl = search.get('returnUrl') || ''
  const statusToken = search.get('token') || ''

  const [checking, setChecking] = useState(false)
  const [message, setMessage] = useState('Your request is still processing. If you approved in wallet, it may complete shortly.')
  const pollRef = useRef(null)

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
  }

  const goToStatus = useCallback((path, status, reason) => {
    const params = new URLSearchParams()
    if (sessionId) params.set('sessionId', sessionId)
    if (returnUrl) params.set('returnUrl', returnUrl)
    if (paymentId) params.set('paymentId', String(paymentId))
    if (status) params.set('status', status)
    if (reason) params.set('reason', reason)
    navigate(`${path}?${params.toString()}`)
  }, [navigate, paymentId, returnUrl, sessionId])

  const handleCheckStatus = useCallback(() => {
    if (!paymentId) {
      setMessage('Payment id missing. Please return to the merchant and try again.')
      return
    }
    if (!statusToken) {
      setMessage('Status token missing. Please return to the merchant and try again.')
      return
    }

    setChecking(true)
    setMessage('Checking latest status...')
    const start = Date.now()
    stopPolling()

    pollRef.current = setInterval(async () => {
      try {
        const data = await fetchPaymentStatus(paymentId, statusToken)
        const status = String(data?.status || '').toUpperCase()
        if (status === 'SUCCESS' || status === 'COMPLETED') {
          stopPolling()
          setChecking(false)
          goToStatus('/checkout/success', status)
          return
        }
        if (status === 'FAILED' || status === 'CANCELLED') {
          stopPolling()
          setChecking(false)
          goToStatus('/checkout/failed', status, data?.reason || data?.displayMessage || 'Payment failed')
          return
        }
      } catch {
        // ignore
      }

      if (Date.now() - start >= 60000) {
        stopPolling()
        setChecking(false)
        setMessage('Still pending. Please check again later or contact support.')
      }
    }, 2500)
  }, [goToStatus, paymentId])

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)] text-[var(--color-text-primary)]">
      <div className="max-w-xl mx-auto px-4 py-10">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm text-center grid gap-3">
          <div className="text-lg font-semibold text-amber-600">Payment Pending</div>
          <div className="text-sm text-slate-500">{message}</div>
          <div className="flex items-center justify-center gap-2 pt-2">
            <button
              type="button"
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm text-white disabled:opacity-60"
              onClick={handleCheckStatus}
              disabled={checking}
            >
              {checking ? 'Checking...' : 'Check Status'}
            </button>
            <button
              type="button"
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm"
              onClick={() => {
                if (returnUrl) {
                  window.location.assign(returnUrl)
                } else {
                  navigate('/pay')
                }
              }}
            >
              Back to Merchant
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CheckoutPendingPage
