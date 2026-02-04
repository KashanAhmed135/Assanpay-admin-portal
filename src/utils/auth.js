import { clearAuthToken, getAuthToken } from './apiClient'

function decodeBase64Url(value) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
  const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=')
  return atob(padded)
}

export function decodeToken(token) {
  if (!token) return null
  const parts = token.split('.')
  if (parts.length < 2) return null

  try {
    const payload = decodeBase64Url(parts[1])
    return JSON.parse(payload)
  } catch {
    return null
  }
}

export function getAuthClaims() {
  const token = getAuthToken()
  if (!token) return null

  const claims = decodeToken(token)
  if (!claims) return null

  if (claims.exp && Date.now() >= claims.exp * 1000) {
    clearAuthToken()
    return null
  }

  return claims
}

export function isMerchantUser(claims) {
  if (!claims) return false
  const type = (claims.userType || '').toUpperCase()
  if (type === 'MERCHANT') return true
  return claims.merchantId !== undefined && claims.merchantId !== null
}

export function hasPermission(permission, claims) {
  const resolved = claims || getAuthClaims()
  const perms = resolved?.permissions || []
  return perms.includes(permission)
}
