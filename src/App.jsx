import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom'
import { LoginPage } from './pages/LoginPage.jsx'
import { MerchantPortal } from './pages/MerchantPortal.jsx'
import { SuperAdminPortal } from './pages/SuperAdminPortal.jsx'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/merchant" element={<MerchantPortal />} />
        <Route path="/admin" element={<SuperAdminPortal />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
