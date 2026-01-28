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
                className={`h-9 w-full rounded-xl border border-white/10 bg-black/20 pl-3 pr-14 text-xs text-[#eaf1ff] outline-none transition focus:ring-2 focus:ring-[#5aa7ff]/50 ${selectClassName}`.trim()}
                value={value}
                onChange={(e) => onChange(e.target.value)}
            >
                {children}
            </select>
            {shouldShowClear && (
                <button
                    type="button"
                    aria-label="Clear selection"
                    className="absolute right-9 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full border border-white/10 bg-white/[0.04] text-[#a9b7d4] hover:text-[#eaf1ff] hover:bg-white/[0.08] transition grid place-items-center"
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
