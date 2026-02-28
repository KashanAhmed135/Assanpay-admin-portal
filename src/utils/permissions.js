import { can as canStore, canAny as canAnyStore, canAll as canAllStore } from './authStore'

export function can(permission) {
  return canStore(permission)
}

export function canAny(permissions) {
  return canAnyStore(permissions)
}

export function canAll(permissions) {
  return canAllStore(permissions)
}

