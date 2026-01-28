import { Search, X } from 'lucide-react'
import { ClearableSelect } from '../ui/ClearableSelect'

export function FilterBar({ children, className = '' }) {
    return (
        <div className={`mb-4 flex flex-wrap items-center gap-2 text-[#a9b7d4]/85 ${className}`.trim()}>
            {children}
        </div>
    )
}

export function DateRangeFilter({ fromValue, toValue, onFromChange, onToChange }) {
    const showFromClear = fromValue && String(fromValue).length > 0
    const showToClear = toValue && String(toValue).length > 0
    return (
        <div className="flex items-center gap-2">
            <div className="relative">
                <input
                    id="dateFrom"
                    name="dateFrom"
                    className="h-10 rounded-xl border border-white/10 bg-black/20 pl-3 pr-16 text-xs text-[#eaf1ff] outline-none transition focus:ring-2 focus:ring-[#5aa7ff]/50"
                    type="date"
                    value={fromValue}
                    onChange={(e) => onFromChange(e.target.value)}
                />
                {showFromClear && (
                    <button
                        type="button"
                        aria-label="Clear start date"
                        className="absolute right-8 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full border border-white/10 bg-white/[0.04] text-[#a9b7d4] hover:text-[#eaf1ff] hover:bg-white/[0.08] transition grid place-items-center"
                        onClick={() => onFromChange('')}
                    >
                        <X size={12} />
                    </button>
                )}
            </div>
            <span className="text-[#a9b7d4]/50">-</span>
            <div className="relative">
                <input
                    id="dateTo"
                    name="dateTo"
                    className="h-10 rounded-xl border border-white/10 bg-black/20 pl-3 pr-16 text-xs text-[#eaf1ff] outline-none transition focus:ring-2 focus:ring-[#5aa7ff]/50"
                    type="date"
                    value={toValue}
                    onChange={(e) => onToChange(e.target.value)}
                />
                {showToClear && (
                    <button
                        type="button"
                        aria-label="Clear end date"
                        className="absolute right-8 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full border border-white/10 bg-white/[0.04] text-[#a9b7d4] hover:text-[#eaf1ff] hover:bg-white/[0.08] transition grid place-items-center"
                        onClick={() => onToChange('')}
                    >
                        <X size={12} />
                    </button>
                )}
            </div>
        </div>
    )
}

export function StatusFilter({ value, onChange, options }) {
    return (
        <ClearableSelect value={value} onChange={onChange} className="min-w-[160px]">
            <option value="" className="bg-[#0b1220]">Status: All</option>
            {options.map((opt) => (
                <option key={opt} value={opt} className="bg-[#0b1220]">
                    {opt}
                </option>
            ))}
        </ClearableSelect>
    )
}

export function ShopFilter({ value, onChange, shops }) {
    return (
        <ClearableSelect value={value} onChange={onChange} className="min-w-[160px]">
            <option value="" className="bg-[#0b1220]">Shop: All</option>
            {shops.map((shop) => (
                <option key={shop} value={shop} className="bg-[#0b1220]">
                    {shop}
                </option>
            ))}
        </ClearableSelect>
    )
}

export function SearchFilter({ value, onChange, placeholder = 'Search...' }) {
    const showClear = value && String(value).length > 0
    return (
        <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a9b7d4]/50" size={14} />
            <input
                id="searchFilter"
                name="searchFilter"
                className="h-9 w-full rounded-xl border border-white/10 bg-black/20 pl-9 pr-9 text-xs text-[#eaf1ff] outline-none transition focus:ring-2 focus:ring-[#5aa7ff]/50 placeholder:text-[#a9b7d4]/40"
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(e.target.value)}
            />
            {showClear && (
                <button
                    type="button"
                    aria-label="Clear search"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full border border-white/10 bg-white/[0.04] text-[#a9b7d4] hover:text-[#eaf1ff] hover:bg-white/[0.08] transition grid place-items-center"
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
            className="h-9 px-4 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.07] transition text-xs font-medium text-[#eaf1ff]"
            type="button"
            onClick={onClick}
        >
            {label}
        </button>
    )
}
