import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom'
import { LoginPage } from './pages/LoginPage.jsx'
import { MerchantPortal } from './pages/MerchantPortal.jsx'
import { SuperAdminPortal } from './pages/SuperAdminPortal.jsx'
import { getAuthClaims, isMerchantUser } from './utils/auth'

function RequireAuth({ role, children }) {
  const claims = getAuthClaims()
  if (!claims) {
    return <Navigate to="/" replace />
  }

  const merchant = isMerchantUser(claims)
  if (role === 'merchant' && !merchant) {
    return <Navigate to="/admin" replace />
  }
  if (role === 'admin' && merchant) {
    return <Navigate to="/merchant" replace />
  }

  return children
}

function Landing() {
  const claims = getAuthClaims()
  if (!claims) {
    return <LoginPage />
  }

  return <Navigate to={isMerchantUser(claims) ? '/merchant' : '/admin'} replace />
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route
          path="/merchant"
          element={
            <RequireAuth role="merchant">
              <MerchantPortal />
            </RequireAuth>
          }
        />
        <Route
          path="/admin"
          element={
            <RequireAuth role="admin">
              <SuperAdminPortal />
            </RequireAuth>
          }
        />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
