import { useState } from 'react'
import { Menu } from 'lucide-react'

/**
 * Shared Topbar Component
 * @param {Object} props
 * @param {String} props.title - Current page title
 * @param {String} props.crumbs - Breadcrumbs text
 * @param {Function} props.onToggle - Toggle sidebar function
 * @param {React.ReactNode} props.actions - Optional action buttons/search
 * @param {Array<{label: string, onClick: Function, active?: boolean}>} props.portalLinks - Optional portal buttons
 */
export function Topbar({
    title,
    crumbs,
    onToggle,
    onDesktopToggle,
    actions,
    height = 'lg',
    portalLinks = [],
    showMenu = true,
    showDesktopMenu = false,
}) {
    const heightClass = height === 'xl' ? 'h-20 sm:h-24' : 'h-16 sm:h-20'
    const [portalOpen, setPortalOpen] = useState(false)
    const hasPortals = Array.isArray(portalLinks) && portalLinks.length > 0

    const portalButtonClass = (active = false) =>
        active
            ? 'h-9 px-3 sm:px-4 rounded-xl border border-[var(--color-accent-border)] bg-[var(--color-accent-soft)] text-xs sm:text-[13px] font-semibold text-[var(--color-text-primary)]'
            : 'h-9 px-3 sm:px-4 rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] text-xs sm:text-[13px] font-semibold text-[var(--color-text-primary)] hover:bg-[var(--color-surface)]'
    return (
        <header className={`sticky top-0 z-30 flex ${heightClass} w-full items-center justify-between border-b border-[var(--color-border-soft)] bg-[var(--color-bg-primary)]/85 backdrop-blur-md px-4 sm:px-6`}>
            <div className="flex items-center gap-3">
                {onToggle && showMenu && (
                    <button
                        className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] text-[var(--color-text-secondary)] lg:hidden hover:bg-[var(--color-surface)]"
                        onClick={onToggle}
                        aria-label="Open navigation"
                        type="button"
                    >
                        <Menu size={20} />
                    </button>
                )}
                {onDesktopToggle && showDesktopMenu && (
                    <button
                        className="hidden lg:flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)]"
                        onClick={onDesktopToggle}
                        aria-label="Expand navigation"
                        type="button"
                    >
                        <Menu size={20} />
                    </button>
                )}
                <div className="flex flex-col">
                    <h2 className="text-base sm:text-xl font-bold text-[var(--color-text-primary)] leading-none">
                        {title}
                    </h2>
                    <div className="text-[11px] sm:text-sm text-[var(--color-text-muted)] mt-1">
                        {crumbs}
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
                {actions}
            </div>
        </header>
    )
}
