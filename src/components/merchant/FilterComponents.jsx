import { Search } from 'lucide-react'

export function FilterBar({ children, className = '' }) {
    return (
        <div className={`mb-4 flex flex-wrap items-center gap-2 text-[#a9b7d4]/85 ${className}`.trim()}>
            {children}
        </div>
    )
}

export function DateRangeFilter({ fromValue, toValue, onFromChange, onToChange }) {
    return (
        <div className="flex items-center gap-2">
            <input
                id="dateFrom"
                name="dateFrom"
                className="h-9 rounded-xl border border-white/10 bg-black/20 px-3 text-xs text-[#eaf1ff] outline-none transition focus:ring-2 focus:ring-[#5aa7ff]/50"
                type="date"
                value={fromValue}
                onChange={(e) => onFromChange(e.target.value)}
            />
            <span className="text-[#a9b7d4]/50">—</span>
            <input
                id="dateTo"
                name="dateTo"
                className="h-9 rounded-xl border border-white/10 bg-black/20 px-3 text-xs text-[#eaf1ff] outline-none transition focus:ring-2 focus:ring-[#5aa7ff]/50"
                type="date"
                value={toValue}
                onChange={(e) => onToChange(e.target.value)}
            />
        </div>
    )
}

export function StatusFilter({ value, onChange, options }) {
    return (
        <select
            id="statusFilter"
            name="statusFilter"
            className="h-9 rounded-xl border border-white/10 bg-black/20 px-3 text-xs text-[#eaf1ff] outline-none transition focus:ring-2 focus:ring-[#5aa7ff]/50"
            value={value}
            onChange={(e) => onChange(e.target.value)}
        >
            <option value="" className="bg-[#0b1220]">Status: All</option>
            {options.map((opt) => (
                <option key={opt} value={opt} className="bg-[#0b1220]">
                    {opt}
                </option>
            ))}
        </select>
    )
}

export function ShopFilter({ value, onChange, shops }) {
    return (
        <select
            id="shopFilter"
            name="shopFilter"
            className="h-9 rounded-xl border border-white/10 bg-black/20 px-3 text-xs text-[#eaf1ff] outline-none transition focus:ring-2 focus:ring-[#5aa7ff]/50"
            value={value}
            onChange={(e) => onChange(e.target.value)}
        >
            <option value="" className="bg-[#0b1220]">Shop: All</option>
            {shops.map((shop) => (
                <option key={shop} value={shop} className="bg-[#0b1220]">
                    {shop}
                </option>
            ))}
        </select>
    )
}

export function SearchFilter({ value, onChange, placeholder = 'Search...' }) {
    return (
        <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a9b7d4]/50" size={14} />
            <input
                id="searchFilter"
                name="searchFilter"
                className="h-9 w-full rounded-xl border border-white/10 bg-black/20 pl-9 pr-4 text-xs text-[#eaf1ff] outline-none transition focus:ring-2 focus:ring-[#5aa7ff]/50 placeholder:text-[#a9b7d4]/40"
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(e.target.value)}
            />
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
