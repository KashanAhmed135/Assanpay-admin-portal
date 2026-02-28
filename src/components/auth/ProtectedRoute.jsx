import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../hooks/useAuthStore'
import { canAll, canAny } from '../../utils/permissions'
import { getAuthClaims } from '../../utils/auth'

export function ProtectedRoute({ anyOf = [], allOf = [], redirectTo = '/', children }) {
  const authState = useAuthStore((state) => ({
    permissionsList: state.permissionsList,
    initialized: state.initialized,
    loading: state.loading,
    token: state.token,
  }))
  const location = useLocation()
  const claims = getAuthClaims()

  if (!authState.initialized || authState.loading) {
    return null
  }

  if (!claims) {
    return <Navigate to={redirectTo} replace state={{ from: location }} />
  }

  if (allOf.length && !canAll(allOf)) {
    return <Navigate to="/forbidden" replace state={{ missing: allOf[0] || 'permission' }} />
  }

  if (anyOf.length && !canAny(anyOf)) {
    return <Navigate to="/forbidden" replace state={{ missing: anyOf[0] || 'permission' }} />
  }

  return children
}

export default ProtectedRoute
