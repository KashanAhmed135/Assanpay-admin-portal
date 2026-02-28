import { useEffect, useRef, useState } from 'react'
import { ChevronDown, Search, X } from 'lucide-react'
import { ClearableSelect } from '../ui/ClearableSelect'
import { ClearableInput } from '../ui/ClearableInput'

export function FilterBar({ children, className = '' }) {
    return (
        <div className={`mb-4 flex flex-wrap items-center gap-2 text-[var(--color-text-secondary)]/85 ${className}`.trim()}>
            {children}
        </div>
    )
}

export function DateRangeFilter({ fromValue, toValue, onFromChange, onToChange }) {
    const [open, setOpen] = useState(false)
    const wrapperRef = useRef(null)
    const buttonRef = useRef(null)
    const [panelStyle, setPanelStyle] = useState({ top: 0, left: 0, width: 320 })
    const hasRange = (fromValue && String(fromValue).length > 0) || (toValue && String(toValue).length > 0)

    useEffect(() => {
        if (!open) return
        const updatePosition = () => {
            if (!buttonRef.current) return
            const rect = buttonRef.current.getBoundingClientRect()
            const desiredWidth = 320
            const padding = 12
            const left = Math.min(
                Math.max(padding, rect.left),
                window.innerWidth - desiredWidth - padding,
            )
            setPanelStyle({
                top: rect.bottom + 8,
                left,
                width: desiredWidth,
            })
        }
        updatePosition()
        window.addEventListener('scroll', updatePosition, true)
        window.addEventListener('resize', updatePosition)
        return () => {
            window.removeEventListener('scroll', updatePosition, true)
            window.removeEventListener('resize', updatePosition)
        }
    }, [open])

    useEffect(() => {
        if (!open) return
        const handleOutside = (event) => {
            if (!wrapperRef.current) return
            if (!wrapperRef.current.contains(event.target)) {
                setOpen(false)
            }
        }
        const handleEscape = (event) => {
            if (event.key === 'Escape') setOpen(false)
        }
        document.addEventListener('mousedown', handleOutside)
        document.addEventListener('keydown', handleEscape)
        return () => {
            document.removeEventListener('mousedown', handleOutside)
            document.removeEventListener('keydown', handleEscape)
        }
    }, [open])

    return (
        <div className="relative" ref={wrapperRef}>
            <button
                type="button"
                className="h-9 rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] px-3 text-xs text-[var(--color-text-primary)] transition hover:bg-[var(--color-surface)] inline-flex items-center gap-2"
                onClick={() => setOpen((prev) => !prev)}
                ref={buttonRef}
            >
                <span>{fromValue && toValue ? `${fromValue} to ${toValue}` : hasRange ? 'Custom range' : 'Custom date'}</span>
                <ChevronDown size={14} className="opacity-70" />
            </button>
            {open && (
                <div
                    className="fixed rounded-2xl border border-[var(--color-border-soft)] bg-[var(--color-surface)] p-4 text-[var(--color-text-primary)] shadow-card z-[60]"
                    style={{ top: panelStyle.top, left: panelStyle.left, width: panelStyle.width }}
                >
                    <div className="text-sm font-semibold">Custom Date</div>
                    <div className="mt-3 space-y-3 text-xs text-[var(--color-text-secondary)]/85">
                        <div>
                            <div className="mb-2">Date Start</div>
                            <div className="relative">
                                <input
                                    id="dateFrom"
                                    name="dateFrom"
                                    className="h-9 w-full rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] pl-3 pr-10 text-xs text-[var(--color-text-primary)] outline-none transition focus:ring-2 focus:ring-[var(--focus-ring)]"
                                    type="date"
                                    value={fromValue}
                                    onChange={(e) => onFromChange(e.target.value)}
                                />
                                {fromValue && (
                                    <button
                                        type="button"
                                        aria-label="Clear start date"
                                        className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface)] transition grid place-items-center"
                                        onClick={() => onFromChange('')}
                                    >
                                        <X size={12} />
                                    </button>
                                )}
                            </div>
                        </div>
                        <div>
                            <div className="mb-2">Date End</div>
                            <div className="relative">
                                <input
                                    id="dateTo"
                                    name="dateTo"
                                    className="h-9 w-full rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] pl-3 pr-10 text-xs text-[var(--color-text-primary)] outline-none transition focus:ring-2 focus:ring-[var(--focus-ring)]"
                                    type="date"
                                    value={toValue}
                                    onChange={(e) => onToChange(e.target.value)}
                                />
                                {toValue && (
                                    <button
                                        type="button"
                                        aria-label="Clear end date"
                                        className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface)] transition grid place-items-center"
                                        onClick={() => onToChange('')}
                                    >
                                        <X size={12} />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="mt-4 flex justify-end gap-2 text-xs">
                        {hasRange && (
                            <button
                                className="h-8 px-3 rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] hover:bg-[var(--color-surface)] transition text-[var(--color-text-primary)]"
                                type="button"
                                onClick={() => {
                                    onFromChange('')
                                    onToChange('')
                                }}
                            >
                                Clear
                            </button>
                        )}
                        <button
                            className="h-8 px-3 rounded-xl bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] transition text-white font-semibold"
                            type="button"
                            onClick={() => setOpen(false)}
                        >
                            Done
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}

export function StatusFilter({ value, onChange, options }) {
    return (
        <ClearableSelect value={value} onChange={onChange} className="min-w-[160px]">
            <option value="" className="theme-select-option">Status: All</option>
            {options.map((opt) => (
                <option key={opt} value={opt} className="theme-select-option">
                    {opt}
                </option>
            ))}
        </ClearableSelect>
    )
}

export function ShopFilter({ value, onChange, shops, listId = 'shopOptions' }) {
    const options = shops.map((shop) => {
        if (typeof shop === 'string') {
            return { value: shop, label: shop }
        }
        return {
            value: shop?.value ?? '',
            label: shop?.label ?? shop?.value ?? '',
        }
    }).filter((opt) => opt.value)

    return (
        <div className="min-w-[180px]">
            <ClearableInput
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder="Shop: All"
                list={listId}
                className="w-full"
                inputClassName="h-9 w-full rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] px-3 text-xs text-[var(--color-text-primary)] outline-none transition focus:ring-2 focus:ring-[var(--focus-ring)]"
            />
            <datalist id={listId}>
                {options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                        {opt.label}
                    </option>
                ))}
            </datalist>
        </div>
    )
}

export function SearchFilter({ value, onChange, placeholder = 'Search...', id, name }) {
    const showClear = value && String(value).length > 0
    return (
        <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)]/50" size={14} />
            <input
                id={id}
                name={name ?? id ?? 'search'}
                className="h-9 w-full rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] pl-9 pr-9 text-xs text-[var(--color-text-primary)] outline-none transition focus:ring-2 focus:ring-[var(--focus-ring)] placeholder:text-[var(--color-text-secondary)]/40"
                placeholder={placeholder}
                value={value}
                autoComplete="off"
                onChange={(e) => onChange(e.target.value)}
            />
            {showClear && (
                <button
                    type="button"
                    aria-label="Clear search"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface)] transition grid place-items-center"
                    onClick={() => onChange('')}
                >
                    <X size={12} />
                </button>
            )}
        </div>
    )
}

export function ExportButton({ onClick, label = 'Export CSV' }) {
    return (
        <button
            className="h-9 px-4 rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] hover:bg-[var(--color-surface)] transition text-xs font-medium text-[var(--color-text-primary)]"
            type="button"
            onClick={onClick}
        >
            {label}
        </button>
    )
}

export function ExportMenu({
    onExportCSV,
    onExportPDF,
    label = 'Export',
    csvLabel = 'Export CSV',
    pdfLabel = 'Export PDF',
    disabled = false,
}) {
    const [open, setOpen] = useState(false)
    const wrapperRef = useRef(null)

    useEffect(() => {
        if (!open) return
        const handleOutside = (event) => {
            if (!wrapperRef.current) return
            if (!wrapperRef.current.contains(event.target)) {
                setOpen(false)
            }
        }
        const handleEscape = (event) => {
            if (event.key === 'Escape') setOpen(false)
        }
        document.addEventListener('mousedown', handleOutside)
        document.addEventListener('keydown', handleEscape)
        return () => {
            document.removeEventListener('mousedown', handleOutside)
            document.removeEventListener('keydown', handleEscape)
        }
    }, [open])

    return (
        <div className="relative" ref={wrapperRef}>
            <button
                className="h-9 px-4 rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] hover:bg-[var(--color-surface)] transition text-xs font-medium text-[var(--color-text-primary)] inline-flex items-center gap-2 disabled:opacity-60"
                type="button"
                onClick={() => setOpen((prev) => !prev)}
                disabled={disabled}
            >
                {label}
                <ChevronDown size={14} className="opacity-70" />
            </button>
            {open && (
                <div className="absolute z-20 mt-2 w-[160px] rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-bg-primary)] shadow-[0_10px_30px_rgba(0,0,0,0.35)] overflow-hidden">
                    <button
                        className="w-full text-left px-3 py-2 text-xs text-[var(--color-text-primary)] hover:bg-white/[0.06] transition disabled:opacity-60"
                        type="button"
                        onClick={() => {
                            setOpen(false)
                            onExportCSV?.()
                        }}
                        disabled={!onExportCSV}
                    >
                        {csvLabel}
                    </button>
                    <button
                        className="w-full text-left px-3 py-2 text-xs text-[var(--color-text-primary)] hover:bg-white/[0.06] transition disabled:opacity-60"
                        type="button"
                        onClick={() => {
                            setOpen(false)
                            onExportPDF?.()
                        }}
                        disabled={!onExportPDF}
                    >
                        {pdfLabel}
                    </button>
                </div>
            )}
        </div>
    )
}
