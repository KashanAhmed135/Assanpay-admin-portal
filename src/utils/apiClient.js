import { pushToast } from './toastStore'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'

const TOKEN_KEY = 'assanpay_token'
const REQUEST_ID_HEADER = 'X-REQUEST-ID'
const SESSION_EXPIRED_KEY = 'assanpay_session_expired'

const buildRequestId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export function getAuthToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function setAuthToken(token) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token)
  }
}

export function clearAuthToken() {
  localStorage.removeItem(TOKEN_KEY)
}

export async function apiRequest(
  path,
  { method = 'GET', body, headers = {}, auth = true } = {}
) {
  const url = `${API_BASE_URL}${path}`
  const requestId = buildRequestId()
  const finalHeaders = {
    'Content-Type': 'application/json',
    [REQUEST_ID_HEADER]: requestId,
    ...headers,
  }

  if (auth) {
    const token = getAuthToken()
    if (token) {
      finalHeaders.Authorization = `Bearer ${token}`
    }
  }

  let response
  try {
    response = await fetch(url, {
      method,
      headers: finalHeaders,
      body: body ? JSON.stringify(body) : undefined,
    })
  } catch (err) {
    const error = new Error('Unable to reach server. Check backend and CORS.')
    error.code = 'NETWORK_ERROR'
    throw error
  }

  if (response.status === 204) {
    return null
  }

  const contentType = response.headers.get('content-type') || ''
  const text = await response.text()
  const data = contentType.includes('application/json') && text ? JSON.parse(text) : null

  if (!response.ok) {
    const message =
      data?.message || data?.errorCode || response.statusText || 'Request failed'
    const error = new Error(message)
    error.status = response.status
    error.data = data
    error.requestId = response.headers.get(REQUEST_ID_HEADER) || requestId
    error.isRetryable = response.status === 429 || response.status >= 500
    if (response.status === 401) {
      clearAuthToken()
      sessionStorage.setItem(SESSION_EXPIRED_KEY, '1')
      window.dispatchEvent(new CustomEvent('assanpay:session-expired', { detail: { status: response.status } }))
      if (window.location.pathname !== '/') {
        window.location.replace('/')
      }
    }
    if (response.status === 403) {
      window.dispatchEvent(new CustomEvent('assanpay:forbidden', { detail: { status: response.status } }))
      if (window.location.pathname !== '/forbidden') {
        window.location.replace('/forbidden')
      }
    }
    if (response.status === 429 || response.status >= 500) {
      pushToast({
        message: 'Service is temporarily unavailable. Please retry in a moment.',
        requestId: error.requestId,
      })
    }
    throw error
  }

  return data
}

export async function login(email, password) {
  const data = await apiRequest('/api/auth/login', {
    method: 'POST',
    body: { email, password },
    auth: false,
  })

  if (!data?.token) {
    throw new Error('Invalid login response')
  }

  setAuthToken(data.token)
  return data.token
}
