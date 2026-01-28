import { LogOut, X } from 'lucide-react'

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
 */
export function Sidebar({
    isOpen,
    setIsOpen,
    activeMenu,
    sections,
    brand,
    footer,
    onLogout
}) {
    return (
        <aside
            className={`fixed z-50 lg:z-auto inset-y-0 left-0 w-[280px] sm:w-[320px] lg:w-[300px]
        bg-[#0b1220] border-r border-white/10 flex flex-col
        transform transition-transform duration-300
        ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
        >
            <div className="h-full flex flex-col">
                {/* Brand */}
                <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-14 h-14 rounded-2xl border border-white/15 bg-white/[0.06] p-2 flex-shrink-0">
                            <img src="/favicon.ico" alt="Logo" className="w-full h-full object-contain" />
                        </div>
                        <div>
                            <div className="text-[16px] sm:text-[17px] font-semibold leading-tight">{brand.name}</div>
                            <div className="text-xs text-[#a9b7d4]/80">{brand.sub}</div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            className="lg:hidden p-2 rounded-xl border border-white/10 bg-white/[0.04] text-[#a9b7d4]"
                            onClick={() => setIsOpen(false)}
                            aria-label="Close navigation"
                            type="button"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto p-3 sm:p-4">
                    {sections.map((sec) => (
                        <div key={sec.section} className="mb-4">
                            <div className="px-2 text-[11px] uppercase tracking-wider text-[#a9b7d4]/70 mb-2">
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
                                                        ? 'border-[rgba(90,167,255,0.35)] bg-[rgba(90,167,255,0.14)] text-[#eaf1ff]'
                                                        : 'border-transparent hover:border-white/10 hover:bg-white/[0.04] text-[#a9b7d4]/90'
                                                    }`}
                                            >
                                                <span className="w-7 h-7 grid place-items-center rounded-lg bg-white/[0.03] border border-white/10">
                                                    <Icon size={14} />
                                                </span>
                                                <span className="text-sm">{it.label}</span>
                                            </a>
                                        </li>
                                    )
                                })}
                            </ul>
                        </div>
                    ))}
                </nav>

                {/* Footer */}
                <div className="p-4 sm:p-5 border-t border-white/10">
                    {footer}
                    {onLogout && (
                        <button
                            className="mt-4 w-full flex items-center gap-3 px-3 py-2 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.07] transition text-[#eaf1ff]"
                            type="button"
                            onClick={onLogout}
                        >
                            <span className="w-7 h-7 grid place-items-center rounded-lg bg-white/[0.03] border border-white/10">
                                <LogOut size={14} />
                            </span>
                            <span className="text-sm">Logout</span>
                        </button>
                    )}
                </div>
            </div>
        </aside>
    )
}
