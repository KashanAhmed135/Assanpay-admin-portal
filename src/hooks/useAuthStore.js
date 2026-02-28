import { useSyncExternalStore } from 'react'
import { getAuthState, subscribeAuth } from '../utils/authStore'

export function useAuthStore(selector) {
  const getSnapshot = () => getAuthState()
  const state = useSyncExternalStore(subscribeAuth, getSnapshot, getSnapshot)
  return selector ? selector(state) : state
}

export default useAuthStore
