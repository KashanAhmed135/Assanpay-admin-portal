import { apiRequest, clearAuthToken, getAuthToken, setAuthToken } from './apiClient'
import { decodeToken, getAuthClaims, isMerchantUser } from './auth'

const AUTH_SESSION_EXPIRED_KEY = 'assanpay_session_expired'

const listeners = new Set()

let state = {
  token: null,
  profile: null,
  permissions: {},
  permissionsList: [],
  initialized: false,
  loading: false,
}

const emit = () => {
  listeners.forEach((listener) => listener())
}

const setState = (patch) => {
  state = { ...state, ...patch }
  emit()
}

const normalizeAuthorities = (profile, claims) => {
  if (Array.isArray(profile?.authorities)) return profile.authorities.filter(Boolean)
  if (Array.isArray(profile?.permissions)) return profile.permissions.filter(Boolean)
  if (Array.isArray(claims?.permissions)) return claims.permissions.filter(Boolean)
  return []
}

const buildPermissionMap = (authorities = []) => {
  const map = {}
  authorities.forEach((permission) => {
    map[permission] = true
  })
  return map
}

const resolveProfileEndpoint = (claims) => {
  if (!claims) return null
  return isMerchantUser(claims) ? '/api/merchant/me' : '/api/admin/me'
}

export function getAuthState() {
  return state
}

export function subscribeAuth(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function setSessionExpiredFlag() {
  sessionStorage.setItem(AUTH_SESSION_EXPIRED_KEY, '1')
}

export function consumeSessionExpiredFlag() {
  const exists = sessionStorage.getItem(AUTH_SESSION_EXPIRED_KEY) === '1'
  if (exists) sessionStorage.removeItem(AUTH_SESSION_EXPIRED_KEY)
  return exists
}

export function clearSessionExpiredFlag() {
  sessionStorage.removeItem(AUTH_SESSION_EXPIRED_KEY)
}

export async function refreshAuthProfile() {
  const claims = getAuthClaims()
  const endpoint = resolveProfileEndpoint(claims)
  if (!endpoint) {
    setState({ profile: null, permissions: {}, permissionsList: [] })
    return null
  }

  setState({ loading: true })

  try {
    const profile = await apiRequest(endpoint)
    const authorities = normalizeAuthorities(profile, claims)
    setState({
      profile,
      permissionsList: authorities,
      permissions: buildPermissionMap(authorities),
    })
    return profile
  } finally {
    setState({ loading: false })
  }
}

export async function initializeAuthStore() {
  if (state.initialized) return

  const token = getAuthToken()
  setState({ initialized: true, token })

  const claims = token ? decodeToken(token) : null
  if (!claims) {
    setState({ permissions: {}, permissionsList: [] })
    return
  }

  if (claims.exp && Date.now() >= claims.exp * 1000) {
    clearAuthToken()
    setState({ token: null, permissions: {}, permissionsList: [] })
    return
  }

  await refreshAuthProfile()
}

export function setAuthTokenState(token) {
  if (token) {
    setAuthToken(token)
  } else {
    clearAuthToken()
  }
  setState({ token: token || null })
}

export function logout() {
  clearAuthToken()
  setState({
    token: null,
    profile: null,
    permissions: {},
    permissionsList: [],
  })
}

export function can(permission) {
  if (!permission) return true
  return !!state.permissions[permission]
}

export function canAny(permissions) {
  const list = Array.isArray(permissions) ? permissions : [permissions]
  if (!list.length) return true
  return list.some((perm) => state.permissions[perm])
}

export function canAll(permissions) {
  const list = Array.isArray(permissions) ? permissions : [permissions]
  if (!list.length) return true
  return list.every((perm) => state.permissions[perm])
}

export function getPermissionsList() {
  return state.permissionsList
}

