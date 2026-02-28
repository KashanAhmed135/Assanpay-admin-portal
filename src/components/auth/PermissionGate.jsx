import { canAll, canAny } from '../../utils/permissions'
import { useAuthStore } from '../../hooks/useAuthStore'

export function PermissionGate({ anyOf = [], allOf = [], fallback = null, children }) {
  useAuthStore((state) => state.permissionsList)
  if (anyOf.length && !canAny(anyOf)) return fallback
  if (allOf.length && !canAll(allOf)) return fallback
  return children
}
