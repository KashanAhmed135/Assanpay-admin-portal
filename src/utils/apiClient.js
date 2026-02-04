const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'

const TOKEN_KEY = 'assanpay_token'

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
  const finalHeaders = {
    'Content-Type': 'application/json',
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
