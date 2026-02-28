import { Outlet } from 'react-router-dom'

export function SubMerchantLayout() {
  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)] text-[var(--color-text-primary)]">
      <Outlet />
    </div>
  )
}

export default SubMerchantLayout
