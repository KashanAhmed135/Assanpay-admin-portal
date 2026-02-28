import { X } from 'lucide-react'

export function ClearableSelect({
    value,
    onChange,
    onClear,
    className = '',
    selectClassName = '',
    clearValue = '',
    showClear,
    children,
}) {
    const shouldShowClear =
        typeof showClear === 'boolean'
            ? showClear
            : value !== '' && value !== 'all' && value !== null && value !== undefined

    return (
        <div className={`relative ${className}`.trim()}>
            <select
                className={`h-9 w-full rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] pl-3 pr-14 text-xs text-[var(--color-text-primary)] outline-none focus:ring-2 focus:ring-[var(--focus-ring)] theme-select ${selectClassName}`.trim()}
                value={value}
                onChange={(e) => onChange(e.target.value)}
            >
                {children}
            </select>
            {shouldShowClear && (
                <button
                    type="button"
                    aria-label="Clear selection"
                    className="absolute right-9 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full border border-[var(--color-border-soft)] bg-[var(--color-surface-muted)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface)] grid place-items-center"
                    onClick={() => {
                        if (onClear) onClear()
                        else onChange(clearValue)
                    }}
                >
                    <X size={12} />
                </button>
            )}
        </div>
    )
}
