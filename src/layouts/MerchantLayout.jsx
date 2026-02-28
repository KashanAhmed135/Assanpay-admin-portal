import { Outlet } from 'react-router-dom'

export function MerchantLayout() {
  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)] text-[var(--color-text-primary)]">
      <Outlet />
    </div>
  )
}

export default MerchantLayout
