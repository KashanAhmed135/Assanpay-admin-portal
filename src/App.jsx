import { BrowserRouter, Route, Routes, Navigate, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { LoginPage } from './pages/LoginPage.jsx'
import { MerchantPortal } from './pages/MerchantPortal.jsx'
import { SuperAdminPortal } from './pages/SuperAdminPortal.jsx'
import { PublicPaymentPage } from './pages/PublicPaymentPage.jsx'
import { CheckoutSuccessPage } from './pages/CheckoutSuccessPage.jsx'
import { CheckoutFailedPage } from './pages/CheckoutFailedPage.jsx'
import { CheckoutPendingPage } from './pages/CheckoutPendingPage.jsx'
import { ForbiddenPage } from './pages/ForbiddenPage.jsx'
import { getAuthClaims, isMerchantUser } from './utils/auth'
import { clearSessionExpiredFlag, consumeSessionExpiredFlag, initializeAuthStore } from './utils/authStore'
import { SessionExpiredModal } from './components/auth/SessionExpiredModal.jsx'
import { ToastHost } from './components/ui/ToastHost.jsx'
import { ProtectedRoute } from './components/auth/ProtectedRoute.jsx'
import { AdminLayout } from './layouts/AdminLayout.jsx'
import { MerchantLayout } from './layouts/MerchantLayout.jsx'
import { SubMerchantLayout } from './layouts/SubMerchantLayout.jsx'
import {
  ADMIN_PORTAL_PERMISSIONS,
  MERCHANT_PORTAL_PERMISSIONS,
  SUB_MERCHANT_PORTAL_PERMISSIONS,
} from './config/permissionMap'

function Landing() {
  const claims = getAuthClaims()
  if (!claims) {
    return <LoginPage />
  }

  return <Navigate to={isMerchantUser(claims) ? '/merchant' : '/admin'} replace />
}

function AuthEventBridge({ onSessionExpired }) {
  const navigate = useNavigate()

  useEffect(() => {
    const handleExpired = () => onSessionExpired(true)
    const handleForbidden = () => navigate('/forbidden', { replace: true })
    window.addEventListener('assanpay:session-expired', handleExpired)
    window.addEventListener('assanpay:forbidden', handleForbidden)
    return () => {
      window.removeEventListener('assanpay:session-expired', handleExpired)
      window.removeEventListener('assanpay:forbidden', handleForbidden)
    }
  }, [navigate, onSessionExpired])

  return null
}

function App() {
  const [sessionExpired, setSessionExpired] = useState(false)

  useEffect(() => {
    initializeAuthStore()
    if (consumeSessionExpiredFlag()) {
      setSessionExpired(true)
    }
  }, [])

  return (
    <BrowserRouter>
      <AuthEventBridge onSessionExpired={setSessionExpired} />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/pay" element={<PublicPaymentPage />} />
        <Route path="/pay/:sessionId" element={<PublicPaymentPage />} />
        <Route path="/checkout/success" element={<CheckoutSuccessPage />} />
        <Route path="/checkout/failed" element={<CheckoutFailedPage />} />
        <Route path="/checkout/pending" element={<CheckoutPendingPage />} />
        <Route path="/forbidden" element={<ForbiddenPage />} />
        <Route
          path="/merchant"
          element={
            <ProtectedRoute anyOf={MERCHANT_PORTAL_PERMISSIONS}>
              <MerchantLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<MerchantPortal />} />
        </Route>
        <Route
          path="/sub-merchant"
          element={
            <ProtectedRoute anyOf={SUB_MERCHANT_PORTAL_PERMISSIONS}>
              <SubMerchantLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<MerchantPortal />} />
        </Route>
        <Route
          path="/admin"
          element={
            <ProtectedRoute anyOf={ADMIN_PORTAL_PERMISSIONS}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<SuperAdminPortal />} />
        </Route>
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
      <SessionExpiredModal
        open={sessionExpired}
        onConfirm={() => {
          setSessionExpired(false)
          clearSessionExpiredFlag()
          window.location.href = '/'
        }}
      />
      <ToastHost />
    </BrowserRouter>
  )
}

export default App
