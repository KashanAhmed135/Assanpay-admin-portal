import { apiRequest } from '../utils/apiClient'

export async function fetchCheckoutSession(sessionId) {
  if (!sessionId) {
    throw new Error('Checkout session id is required')
  }

  return apiRequest(`/api/checkout/sessions/${encodeURIComponent(sessionId)}`, {
    auth: false,
  })
}

export async function payCheckoutSession(sessionId, payload) {
  if (!sessionId) {
    throw new Error('Checkout session id is required')
  }

  return apiRequest(`/api/checkout/sessions/${encodeURIComponent(sessionId)}/pay`, {
    method: 'POST',
    body: payload,
    auth: false,
  })
}

export async function fetchPaymentStatus(paymentId, token) {
  if (!paymentId) {
    throw new Error('Payment id is required')
  }
  if (!token) {
    throw new Error('Public status token is required')
  }

  return apiRequest(`/api/public/payments/${encodeURIComponent(paymentId)}/status?token=${encodeURIComponent(token)}`, {
    auth: false,
  })
}

export async function retryCheckoutSession(sessionId) {
  if (!sessionId) {
    throw new Error('Checkout session id is required')
  }

  return apiRequest(`/api/checkout/sessions/${encodeURIComponent(sessionId)}/retry`, {
    method: 'POST',
    auth: false,
  })
}
