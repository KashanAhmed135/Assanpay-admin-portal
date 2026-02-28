import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

const currencySymbols = {
  PKR: 'PKR',
  USD: '$',
  EUR: 'EUR',
  GBP: 'GBP',
}

const formatAmount = (amount, currency) => {
  if (amount === null || amount === undefined || amount === '') return '-'
  const num = Number(amount)
  if (Number.isNaN(num)) return String(amount)
  const symbol = currencySymbols[String(currency || '').toUpperCase()] || String(currency || '')
  if (!symbol) return num.toLocaleString()
  if (symbol.length === 1) return `${symbol}${num.toLocaleString()}`
  return `${num.toLocaleString()} ${symbol}`
}

export function CheckoutSuccessPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const search = useMemo(() => new URLSearchParams(location.search), [location.search])
  const orderId = search.get('orderId') || '-'
  const amount = search.get('amount')
  const currency = search.get('currency')
  const returnUrl = search.get('returnUrl') || ''
  const [redirectIn, setRedirectIn] = useState(returnUrl ? 3 : 0)

  useEffect(() => {
    if (!returnUrl) return
    if (redirectIn <= 0) {
      window.location.assign(returnUrl)
      return
    }
    const timer = setTimeout(() => setRedirectIn((prev) => prev - 1), 1000)
    return () => clearTimeout(timer)
  }, [redirectIn, returnUrl])

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)] text-[var(--color-text-primary)]">
      <div className="max-w-xl mx-auto px-4 py-10">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm text-center grid gap-3">
          <div className="text-lg font-semibold text-emerald-600">Payment Successful</div>
          <div className="text-sm text-slate-500">Order ID: {orderId}</div>
          <div className="text-2xl font-semibold">{formatAmount(amount, currency)}</div>
          {returnUrl ? (
            <div className="text-xs text-slate-400">Redirecting you back in {redirectIn}s</div>
          ) : null}
          <div className="flex items-center justify-center gap-2 pt-2">
            <button
              type="button"
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm"
              onClick={() => navigate('/pay')}
            >
              New Payment
            </button>
            {returnUrl && (
              <button
                type="button"
                className="rounded-xl bg-blue-600 px-4 py-2 text-sm text-white"
                onClick={() => window.location.assign(returnUrl)}
              >
                Back to Merchant
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default CheckoutSuccessPage
