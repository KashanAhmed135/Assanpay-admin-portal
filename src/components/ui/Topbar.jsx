import { Menu } from 'lucide-react'

/**
 * Shared Topbar Component
 * @param {Object} props
 * @param {String} props.title - Current page title
 * @param {String} props.crumbs - Breadcrumbs text
 * @param {Function} props.onToggle - Toggle sidebar function
 * @param {React.ReactNode} props.actions - Optional action buttons/search
 */
export function Topbar({ title, crumbs, onToggle, actions }) {
    return (
        <header className="sticky top-0 z-30 flex h-16 sm:h-20 w-full items-center justify-between border-b border-white/10 bg-[#060b13]/85 backdrop-blur-md px-4 sm:px-6">
            <div className="flex items-center gap-3">
                <button
                    className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-[#a9b7d4] lg:hidden transition hover:bg-white/[0.08]"
                    onClick={onToggle}
                    aria-label="Open navigation"
                    type="button"
                >
                    <Menu size={20} />
                </button>
                <div className="flex flex-col">
                    <h2 className="text-sm sm:text-lg font-bold text-[#eaf1ff] leading-none">
                        {title}
                    </h2>
                    <div className="text-[10px] sm:text-xs text-[#a9b7d4]/60 mt-1">
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
