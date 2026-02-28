import { LogOut, X, ChevronLeft } from 'lucide-react'

/**
 * Shared Sidebar Component
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether the sidebar is open on mobile
 * @param {Function} props.setIsOpen - Function to toggle the sidebar
 * @param {String} props.activeMenu - Key of the active menu item
 * @param {Array} props.sections - Array of { section: string, items: Array<{ key: string, label: string, icon: Component }> }
 * @param {Object} props.brand - { name: string, sub: string }
 * @param {React.ReactNode} props.footer - Optional footer content
 * @param {Function} props.onLogout - Link/Function for logout
 * @param {boolean} props.isCollapsed - Whether the sidebar is collapsed on desktop
 * @param {Function} props.onCollapseToggle - Toggle sidebar collapse (desktop)
 */
export function Sidebar({
    isOpen,
    setIsOpen,
    activeMenu,
    sections,
    brand,
    footer,
    onLogout,
    isCollapsed = false,
    onCollapseToggle
}) {
    return (
        <aside
            className={`${isOpen ? 'flex' : 'hidden'} md:flex relative z-30 w-[280px] sm:w-[320px] md:w-[300px] ${isCollapsed ? 'md:w-0 lg:w-0 md:border-r-0 lg:border-r-0 md:pointer-events-none md:overflow-hidden' : ''}
        bg-[var(--color-bg-primary)] border-r border-[var(--color-border-soft)] flex-col overflow-hidden md:fixed md:left-0 md:top-0 h-screen transition-[width] duration-300`}
        >
            <div className="h-full flex flex-col relative">
                {/* Brand */}
                <div className={`relative border-b border-[var(--color-border-soft)] overflow-visible px-4 sm:px-6 h-20 sm:h-24 flex items-center`}>
                    <div className="flex items-center justify-between w-full">
                    <div className={`flex items-center ${isCollapsed ? 'w-full justify-center' : 'gap-3'}`}>
                        {!isCollapsed && (
                            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl border border-[var(--color-border-soft)] bg-white/[0.06] p-2 flex-shrink-0">
                                <img src="/favicon.ico" alt="Logo" className="w-full h-full object-contain" />
                            </div>
                        )}
                        {!isCollapsed && (
                            <div className="hidden lg:block">
                                <div className="text-[16px] sm:text-[17px] font-semibold leading-tight">{brand.name}</div>
                                <div className="text-xs text-[var(--color-text-secondary)]">{brand.sub}</div>
                            </div>
                        )}
                        <div className="lg:hidden">
                            <div className="text-[16px] sm:text-[17px] font-semibold leading-tight">{brand.name}</div>
                            <div className="text-xs text-[var(--color-text-secondary)]">{brand.sub}</div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {onCollapseToggle && !isCollapsed && (
                            <button
                                className="hidden lg:inline-flex absolute -right-1 top-1/2 -translate-y-1/2 h-6 w-6 items-center justify-center rounded-full border border-[var(--color-border-soft)] bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] shadow-[0_0_0_1px_var(--color-accent-soft),0_5px_12px_rgba(0,0,0,0.3)] hover:shadow-[0_0_0_1px_var(--color-accent-border),0_7px_16px_rgba(0,0,0,0.4)]"
                                onClick={onCollapseToggle}
                                aria-label={isCollapsed ? 'Expand navigation' : 'Collapse navigation'}
                                type="button"
                            >
                                <ChevronLeft size={11} />
                            </button>
                        )}
                        <button
                            className="lg:hidden p-2 rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] text-[var(--color-text-secondary)]"
                            onClick={() => setIsOpen(false)}
                            aria-label="Close navigation"
                            type="button"
                        >
                            <X size={18} />
                        </button>
                    </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className={`flex-1 overflow-y-auto theme-scrollbar ${isCollapsed ? 'p-0' : 'p-3 sm:p-4'}`}>
                    {!isCollapsed && sections.map((sec) => (
                        <div key={sec.section} className="mb-4">
                            {!isCollapsed && (
                                <div className="hidden lg:block px-2 text-[11px] uppercase tracking-wider text-[var(--color-text-muted)] mb-2">
                                    {sec.section}
                                </div>
                            )}
                            <div className="lg:hidden px-2 text-[11px] uppercase tracking-wider text-[var(--color-text-muted)] mb-2">
                                {sec.section}
                            </div>
                            <ul className="space-y-1">
                                {sec.items.map((it) => {
                                    const active = it.key === activeMenu
                                    const Icon = it.icon
                                    return (
                                        <li key={it.key}>
                                            <a
                                                href={`#${it.key}`}
                                                onClick={() => setIsOpen(false)}
                                                    className={`flex items-center gap-3 px-3 py-2 rounded-xl border transition
                          ${active
                                                        ? 'border-[var(--color-accent-border)] bg-[var(--color-accent-soft)] text-[var(--color-text-primary)]'
                                                        : 'border-transparent hover:border-[var(--color-border-soft)] hover:bg-[var(--color-surface-muted)] text-[var(--color-text-secondary)]'
                                                    }`}
                                                title={it.label}
                                            >
                                                <span className="w-7 h-7 grid place-items-center rounded-lg bg-[var(--color-surface-muted)] border border-[var(--color-border-soft)]">
                                                    <Icon size={14} />
                                                </span>
                                                <span className="hidden lg:inline text-sm">{it.label}</span>
                                                <span className="lg:hidden text-sm">{it.label}</span>
                                            </a>
                                        </li>
                                    )
                                })}
                            </ul>
                        </div>
                    ))}
                </nav>

                {/* Footer */}
                <div className={`border-t border-[var(--color-border-soft)] ${isCollapsed ? 'p-0' : 'p-4 sm:p-5'}`}>
                    {footer && !isCollapsed && (
                        <>
                            <div className="hidden lg:block">
                                {footer}
                            </div>
                            <div className="lg:hidden">
                                {footer}
                            </div>
                        </>
                    )}
                    {onLogout && !isCollapsed && (
                        <button
                            className={`mt-4 w-full flex items-center gap-3 px-3 py-2 rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] hover:bg-[var(--color-surface)] text-[var(--color-text-primary)] ${isCollapsed ? 'lg:justify-center lg:px-2' : ''}`}
                            type="button"
                            onClick={onLogout}
                        >
                            <span className="w-7 h-7 grid place-items-center rounded-lg bg-[var(--color-surface-muted)] border border-[var(--color-border-soft)]">
                                <LogOut size={14} />
                            </span>
                            {!isCollapsed && <span className="hidden lg:inline text-sm">Logout</span>}
                            <span className="lg:hidden text-sm">Logout</span>
                        </button>
                    )}
                </div>
            </div>
        </aside>
    )
}
