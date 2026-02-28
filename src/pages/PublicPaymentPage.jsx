import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { fetchCheckoutSession, payCheckoutSession } from '../api/publicPaymentApi'
import { getPaymentMethodLogo } from '../utils/paymentLogos'

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

const isWalletMethod = (name = '') => {
  const n = name.toLowerCase()
  return n.includes('easypaisa') || n.includes('jazzcash') || n.includes('wallet')
}

const isCardMethod = (name = '') => {
  const n = name.toLowerCase()
  return n.includes('card')
}

const DEFAULT_SESSION_TTL_MS = 10 * 60 * 1000

export function PublicPaymentPage() {
  const { sessionId: sessionIdFromPath } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const search = useMemo(() => new URLSearchParams(location.search), [location.search])

  const sessionId = sessionIdFromPath || search.get('sessionId') || search.get('session') || ''
  const returnUrl = search.get('returnUrl') || ''

  const [session, setSession] = useState(null)
  const [methods, setMethods] = useState([])
  const [selectedMethod, setSelectedMethod] = useState(null)
  const [mobileNumber, setMobileNumber] = useState('')
  const [expiresAt, setExpiresAt] = useState(null)
  const [countdown, setCountdown] = useState('')
  const [attemptCountdown, setAttemptCountdown] = useState('')
  const [attemptExpiresAt, setAttemptExpiresAt] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [waiting, setWaiting] = useState(false)
  const [paymentId, setPaymentId] = useState(null)
  const [statusToken, setStatusToken] = useState('')
  const [pspMessage, setPspMessage] = useState('')
  const [showFailedActions, setShowFailedActions] = useState(false)
  const [lastFailReason, setLastFailReason] = useState('')
  const [failedRedirectAt, setFailedRedirectAt] = useState(null)
  const [failedRedirectCountdown, setFailedRedirectCountdown] = useState('')

  const pollRef = useRef(null)

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
  }

  const goToStatus = useCallback((path, status, reason) => {
    const normalized = String(status || '').toUpperCase()
    const successRedirect = session?.successUrl || ''
    const failedRedirect = session?.failedUrl || ''
    if ((normalized === 'SUCCESS' || normalized === 'COMPLETED') && successRedirect) {
      window.location.assign(successRedirect)
      return
    }
    if ((normalized === 'FAILED' || normalized === 'REJECTED' || normalized === 'CANCELLED') && failedRedirect) {
      window.location.assign(failedRedirect)
      return
    }
    const params = new URLSearchParams()
    if (sessionId) params.set('sessionId', sessionId)
    if (returnUrl) params.set('returnUrl', returnUrl)
    if (paymentId) params.set('paymentId', String(paymentId))
    if (statusToken) params.set('token', String(statusToken))
    if (session?.orderId) params.set('orderId', String(session.orderId))
    if (session?.amount != null) params.set('amount', String(session.amount))
    if (session?.currency) params.set('currency', String(session.currency))
    if (status) params.set('status', status)
    if (reason) params.set('reason', reason)
    navigate(`${path}?${params.toString()}`)
  }, [navigate, paymentId, returnUrl, session?.amount, session?.currency, session?.failedUrl, session?.orderId, session?.successUrl, sessionId, statusToken])

  useEffect(() => {
    let active = true
    const load = async () => {
      setLoading(true)
      setError('')
      setSelectedMethod(null)
      setWaiting(false)
      setPaymentId(null)
      setStatusToken('')
      setPspMessage('')
      setAttemptExpiresAt(null)
      setAttemptCountdown('')
      setShowFailedActions(false)
      setLastFailReason('')
      setFailedRedirectAt(null)
      setFailedRedirectCountdown('')
      setMobileNumber('')

      if (!sessionId) {
        setLoading(false)
        setError('Missing checkout session. Please use the payment link provided by the merchant.')
        return
      }

      try {
        const data = await fetchCheckoutSession(sessionId)
        if (!active) return
        const paymentMethods = data?.paymentMethods || data?.payment_methods || []
        const normalized = Array.isArray(paymentMethods)
          ? paymentMethods.map((m) => ({
              id: m.id ?? m.paymentMethodId ?? m.code ?? m.name ?? String(m),
              name: m.name ?? m.paymentMethodName ?? m.label ?? String(m),
              raw: m,
            }))
          : []

        setSession(data || null)
        setMethods(normalized)

        if (data?.expiresAt) {
          const exp = Number(data.expiresAt)
          setExpiresAt(exp > 1e12 ? exp : exp * 1000)
        } else {
          setExpiresAt(Date.now() + DEFAULT_SESSION_TTL_MS)
        }

        setLoading(false)
      } catch (err) {
        if (!active) return
        setError(err?.data?.message || err?.message || 'Unable to load payment details.')
        setLoading(false)
      }
    }

    load()
    return () => {
      active = false
    }
  }, [sessionId])

  useEffect(() => {
    if (!expiresAt) return
    const timer = setInterval(() => {
      const diff = Math.max(0, expiresAt - Date.now())
      const min = Math.floor(diff / 60000)
      const sec = Math.floor((diff % 60000) / 1000)
      setCountdown(`${min}m ${sec}s`)
    }, 1000)
    return () => clearInterval(timer)
  }, [expiresAt])

  useEffect(() => {
    if (!attemptExpiresAt) return
    const timer = setInterval(() => {
      const diff = Math.max(0, attemptExpiresAt - Date.now())
      const min = Math.floor(diff / 60000)
      const sec = Math.floor((diff % 60000) / 1000)
      setAttemptCountdown(`${min}m ${sec}s`)
      if (diff === 0) {
        setWaiting(false)
        stopPolling()
        setError('Payment failed or expired. Please try again or change method.')
        setAttemptExpiresAt(null)
      }
    }, 1000)
    return () => clearInterval(timer)
  }, [attemptExpiresAt])

  useEffect(() => {
    if (!showFailedActions || !session?.failedUrl) {
      setFailedRedirectAt(null)
      setFailedRedirectCountdown('')
      return
    }
    const deadline = Date.now() + 30000
    setFailedRedirectAt(deadline)
    setFailedRedirectCountdown('30s')
  }, [showFailedActions, session?.failedUrl])

  useEffect(() => {
    if (!failedRedirectAt || !showFailedActions || !session?.failedUrl) return
    const timer = setInterval(() => {
      const diff = Math.max(0, failedRedirectAt - Date.now())
      const sec = Math.ceil(diff / 1000)
      setFailedRedirectCountdown(`${sec}s`)
      if (diff === 0) {
        setFailedRedirectAt(null)
        setFailedRedirectCountdown('')
        goToStatus('/checkout/failed', 'FAILED', lastFailReason)
      }
    }, 500)
    return () => clearInterval(timer)
  }, [failedRedirectAt, goToStatus, lastFailReason, session?.failedUrl, showFailedActions])

  const pollStatus = useCallback(() => {
    // polling removed: UI relies on /pay response + 60s timer
  }, [])

  const resolveMethodExpirySeconds = (method, response) => {
    const responseValue = response?.paymentExpiresInSeconds ?? response?.paymentExpirySeconds
    const responseParsed = Number(responseValue)
    if (Number.isFinite(responseParsed) && responseParsed > 0) {
      return responseParsed
    }
    const raw = method?.raw || method || {}
    const value =
      raw.expiresInSeconds ??
      raw.expirySeconds ??
      raw.ttlSeconds ??
      raw.paymentExpirySeconds ??
      raw.paymentExpiresInSeconds
    const parsed = Number(value)
    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed
    }
    if (isWalletMethod(method?.name || '')) {
      return 60
    }
    return 300
  }

  const handlePay = async () => {
    if (!selectedMethod) {
      setError('Select a payment method to continue.')
      return
    }

    if (isWalletMethod(selectedMethod.name)) {
      const normalized = mobileNumber.trim()
      if (normalized.length < 10) {
        setError('Enter a valid mobile number.')
        return
      }
    }

    const initialExpirySeconds = resolveMethodExpirySeconds(selectedMethod)
    const initialAttemptExpiry = Date.now() + initialExpirySeconds * 1000
    const initialSessionExpiry = expiresAt || initialAttemptExpiry
    setAttemptExpiresAt(Math.min(initialAttemptExpiry, initialSessionExpiry))
    setAttemptCountdown('')
    setSubmitting(true)
    setError('')
    setWaiting(false)

    try {
      const payload = {
        paymentMethodId: selectedMethod.id,
        paymentMethodName: selectedMethod.name,
        mobileNumber: isWalletMethod(selectedMethod.name) ? mobileNumber.trim() : undefined,
      }

      const response = await payCheckoutSession(sessionId, payload)
      const methodExpirySeconds = resolveMethodExpirySeconds(selectedMethod, response)
      const nextAttemptExpiry = Date.now() + methodExpirySeconds * 1000
      const sessionExpiry = expiresAt || nextAttemptExpiry
      setAttemptExpiresAt(Math.min(nextAttemptExpiry, sessionExpiry))
      setAttemptCountdown('')
      const redirectUrl =
        response?.redirectUrl ||
        response?.paymentUrl ||
        response?.url ||
        response?.redirect_url ||
        response?.payment_url

      if (redirectUrl) {
        window.location.assign(redirectUrl)
        return
      }

      const status = String(response?.status || '').toUpperCase()
      const message = response?.displayMessage || ''

      if (message) {
        setPspMessage(message)
      }

      if (status === 'SUCCESS' || status === 'COMPLETED') {
        stopPolling()
        goToStatus('/checkout/success', status)
        return
      }
      if (status === 'REJECTED' || status === 'FAILED' || status === 'CANCELLED') {
        stopPolling()
        setLastFailReason(message || 'Payment failed.')
        setError(message || 'Payment failed.')
        setWaiting(false)
        setAttemptExpiresAt(null)
        setAttemptCountdown('')
        setShowFailedActions(true)
        setFailedRedirectAt(Date.now() + 30000)
        return
      }

      setShowFailedActions(false)
      setLastFailReason('')
      setWaiting(true)
      pollStatus()
    } catch (err) {
      const errMsg = err?.data?.message || err?.message || 'Unable to start payment.'
      setError(errMsg)
      setAttemptExpiresAt(null)
      setAttemptCountdown('')
      setShowFailedActions(true)
      setLastFailReason(errMsg)
      setFailedRedirectAt(Date.now() + 30000)
    } finally {
      setSubmitting(false)
    }
  }

  const handleChangeMethod = () => {
    setSelectedMethod(null)
    setMobileNumber('')
    setError('')
    setPspMessage('')
    setWaiting(false)
    setAttemptExpiresAt(null)
    setAttemptCountdown('')
    setShowFailedActions(false)
    setLastFailReason('')
    setFailedRedirectAt(null)
    setFailedRedirectCountdown('')
    stopPolling()
  }

  const showRequirements = Boolean(selectedMethod)
  const isWallet = selectedMethod ? isWalletMethod(selectedMethod.name) : false
  const isCard = selectedMethod ? isCardMethod(selectedMethod.name) : false

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)] text-[var(--color-text-primary)]">
      <div className="max-w-3xl mx-auto px-4 py-8 grid gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-white shadow-sm border border-slate-200 grid place-items-center">
            <img src="/favicon.ico" alt="AssanPay" className="h-7 w-7 object-contain" />
          </div>
          <div>
            <div className="text-base font-semibold">AssanPay Checkout</div>
            <div className="text-xs text-slate-500">Secure payment powered by AssanPay</div>
          </div>
          <div className="ml-auto text-xs text-slate-600">
            Session: <span className="font-semibold text-red-600">{countdown || '-'}</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-sm font-semibold">Order Summary</div>
          {loading ? (
            <div className="text-sm text-slate-500 mt-2">Loading session...</div>
          ) : (
            <div className="mt-3 grid gap-2 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">Merchant</span><span>{session?.merchantName || '-'}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Order ID</span><span>{session?.orderId || '-'}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Amount</span><span>{formatAmount(session?.amount, session?.currency)}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Currency</span><span>{session?.currency || '-'}</span></div>
              <div className="flex justify-between">
                <span className="text-slate-500">Session Expires In</span>
                <span className="text-red-600 font-semibold">{countdown || '-'}</span>
              </div>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold">Payment Methods</div>
            {selectedMethod && (
              <button
                type="button"
                className="text-xs text-blue-600"
                onClick={handleChangeMethod}
              >
                Change method
              </button>
            )}
          </div>
          <div className="mt-3 grid gap-2">
            {methods.length === 0 && !loading && (
              <div className="text-sm text-slate-500">No payment methods available.</div>
            )}
            {methods
              .filter((m) => !selectedMethod || selectedMethod.id === m.id)
              .map((m) => {
                const active = selectedMethod?.id === m.id
                const logo = getPaymentMethodLogo(m.name)
                const initials = String(m.name || '?').trim().slice(0, 2).toUpperCase()
                return (
                  <button
                    key={m.id}
                    type="button"
                    className={`flex items-center justify-between rounded-xl border px-4 py-3 text-left text-sm transition ${
                      active ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:bg-slate-50'
                    }`}
                    onClick={() => setSelectedMethod(m)}
                  >
                    <div className="flex items-center gap-3">
                      {logo ? (
                        <img src={logo} alt={m.name} className="h-8 w-8 rounded-full bg-white object-contain p-1" />
                      ) : (
                        <span className="h-8 w-8 rounded-full bg-slate-100 text-[10px] grid place-items-center">{initials}</span>
                      )}
                      <div>{m.name}</div>
                    </div>
                    <div className="text-xs text-slate-400">{isCardMethod(m.name) ? 'Card' : 'Wallet'}</div>
                  </button>
                )
              })}
          </div>
        </div>

        {showRequirements && (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="text-sm font-semibold">Payment Details</div>
            {isWallet && (
              <div className="mt-3 grid gap-2 text-sm">
                <label htmlFor="mobileNumber" className="text-slate-500">Mobile Number</label>
                <input
                  id="mobileNumber"
                  type="tel"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  placeholder="03xxxxxxxxx"
                  className="h-10 rounded-lg border border-slate-200 px-3"
                />
                <div className="text-xs text-slate-400">Enter your wallet number (11 digits).</div>
              </div>
            )}
            {isCard && (
              <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                You’ll be redirected to a secure card approval page.
              </div>
            )}
          </div>
        )}

        {pspMessage && !error && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-700">
            {pspMessage}
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        {showRequirements && (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <button
              type="button"
              className="w-full rounded-xl bg-blue-600 py-3 text-white font-semibold disabled:opacity-60"
              disabled={submitting || waiting}
              onClick={handlePay}
            >
              {submitting
                ? 'Processing...'
                : isCard
                  ? 'Pay with Card ?'
                  : 'Pay Now'}
            </button>
            {attemptExpiresAt && (
              <div className="mt-3 text-sm text-slate-500">
                Payment attempt expires in <span className="font-semibold">{attemptCountdown || '-'}</span>
              </div>
            )}
            {waiting && (
              <div className="mt-3 text-sm text-slate-500">Waiting for confirmation...</div>
            )}
            {error && !waiting && !showFailedActions && (
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700"
                  onClick={handlePay}
                >
                  Retry
                </button>
                <button
                  type="button"
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700"
                  onClick={handleChangeMethod}
                >
                  Change Method
                </button>
              </div>
            )}
            {showFailedActions && session?.failedUrl && (
              <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                <div className="font-semibold">Payment failed.</div>
                <div className="text-slate-500">
                  {lastFailReason || 'The payment could not be completed.'}
                </div>
                <div className="mt-2 text-xs text-slate-500">
                  Redirecting in {failedRedirectCountdown || '30s'} if no action is taken.
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700"
                    onClick={handlePay}
                  >
                    Retry
                  </button>
                  <button
                    type="button"
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700"
                    onClick={handleChangeMethod}
                  >
                    Change Method
                  </button>
                  <button
                    type="button"
                    className="rounded-lg bg-red-600 px-3 py-2 text-sm text-white"
                    onClick={() => goToStatus('/checkout/failed', 'FAILED', lastFailReason)}
                  >
                    Go to Failed Page
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default PublicPaymentPage






